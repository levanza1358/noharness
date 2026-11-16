// @vitest-environment jsdom
/** The Models page: the provider picker and the chosen provider's model editor. */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@noharness/client-test-runtime'
import { SettingsDescribeMirror } from '@noharness/client-ui-settings/src/client/settings-mirror.ts'
import { ModelsPage } from '../src/client/ModelsPage.tsx'
import { ModelsSettingsStore } from '../src/client/store.ts'
import { en } from '../src/client/locales.ts'
import { ctxWith, operationsWith, remoteFail, remoteOk, scriptedFace, wireNamespaces } from './page-fixture.client.ts'
import { settingsSchema } from './settings-schema.client.ts'

afterEach(cleanup)

const t = (key: keyof typeof en): string => en[key]

async function mountPage(scripted: ReturnType<typeof scriptedFace>, load = true) {
  const { face } = scripted
  const ctx = ctxWith(face)
  const controller = new ModelsSettingsStore(ctx, settingsSchema, new SettingsDescribeMirror(ctx))
  if (load) await controller.load()
  const renderSlot = vi.fn((..._call: unknown[]) => null)
  render(<ModelsPage
    controller={controller}
    useSnapshot={bindSnapshotSelector(controller.store)}
    operations={operationsWith(face)}
    schema={settingsSchema}
    t={t}
    renderSlot={renderSlot as never}
  />)
  return { controller, renderSlot }
}

describe('ModelsPage', () => {
  it('asks for a provider on the Providers page when none is configured', async () => {
    const scripted = scriptedFace()
    scripted.face.settings.describe.mockResolvedValue(remoteOk({ writable: true, hasDocument: false, namespaces: [] }))
    await mountPage(scripted)
    expect(screen.getByText(en.noModelsProvider)).toBeTruthy()
    expect(screen.queryByLabelText(en.providerSelect)).toBeNull()
  })

  it('opens on the first configured provider with its model list', async () => {
    await mountPage(scriptedFace())
    expect(screen.getByRole('heading', { name: en.title })).toBeTruthy()
    expect(screen.getByText(en.intro)).toBeTruthy()
    expect(screen.getByLabelText<HTMLSelectElement>(en.providerSelect).value).toBe('deepseek-official')
    expect(screen.getByRole('region', { name: en.models })).toBeTruthy()
  })

  it('switches the edited provider from the picker', async () => {
    const { renderSlot } = await mountPage(scriptedFace())
    const picker = screen.getByLabelText(en.providerSelect) as HTMLSelectElement
    await act(async () => { fireEvent.change(picker, { target: { value: 'openai' } }) })
    expect(screen.getByLabelText<HTMLSelectElement>(en.providerSelect).value).toBe('openai')
    const seats = renderSlot.mock.calls.filter(call => call[0] === 'settings.models.provider-card')
    expect((seats.at(-1)?.[2] as { entryKey: string }).entryKey).toBe('llm-pi-ai')
  })

  it('dispatches the provider-card seat for the chosen provider', async () => {
    const { renderSlot } = await mountPage(scriptedFace())
    const calls = renderSlot.mock.calls.filter(call => call[0] === 'settings.models.provider-card')
    expect(calls[0]?.[2]).toMatchObject({ entryKey: 'llm-deepseek' })
  })

  it('loads the directory on its own when it mounts idle', async () => {
    const scripted = scriptedFace()
    const { controller } = await mountPage(scripted, false)
    await waitFor(() => { expect(controller.store.getSnapshot().status).toBe('ready') })
    expect(scripted.face.llm.listConfigurableProviders).toHaveBeenCalled()
  })

  it('shows a failed directory read with a retry control', async () => {
    const scripted = scriptedFace()
    scripted.face.settings.describe.mockResolvedValueOnce(remoteOk({ writable: true, hasDocument: false, namespaces: wireNamespaces() }))
    scripted.face.llm.listConfigurableProviders.mockImplementationOnce(
      () => Promise.resolve(remoteFail('directory down', 'gateway/internal')))
    const { controller } = await mountPage(scripted)
    await waitFor(() => { expect(screen.getByText(/directory down/)).toBeTruthy() })
    scripted.face.llm.listConfigurableProviders.mockResolvedValue(remoteOk([]))
    await act(async () => { fireEvent.click(screen.getByText(en.retry)) })
    await waitFor(() => { expect(controller.store.getSnapshot().status).toBe('ready') })
  })

  it('opens with the provider endpoint and key as the page fields', async () => {
    await mountPage(scriptedFace())
    expect(screen.getByText(en.customized)).toBeTruthy()
    expect(screen.getByLabelText(en.keyInput)).toBeTruthy()
    expect(screen.getByLabelText(en.baseUrl)).toBeTruthy()
  })

  it('leads a credential card with the key and no fallback reference', async () => {
    await mountPage(scriptedFace())
    expect(screen.getByLabelText<HTMLInputElement>(en.keyInput).required).toBe(false)
    expect(screen.getByLabelText(en.baseUrl)).toBeTruthy()
  })

  it('reports the provider an applied edit names', async () => {
    await mountPage(scriptedFace())
    await act(async () => {
      fireEvent.change(screen.getByLabelText(en.baseUrl), { target: { value: 'https://relay.example/v1' } })
    })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.apply })) })
    await waitFor(() => { expect(screen.getByRole('status').textContent).toContain('DeepSeek') })
  })

  it('renders nothing before the shell injects', () => {
    expect(render(<ModelsPage renderSlot={(() => null) as never} />).container.innerHTML).toBe('')
  })

  it('names the account route in the picker and reports a derived key through the seat', async () => {
    const { renderSlot } = await mountPage(scriptedFace({}, {
      providers: () => Promise.resolve(remoteOk([
        { provider: 'deepseek-official', displayName: 'DeepSeek', settingsNs: 'llm-deepseek', settingsPath: [] },
        { provider: 'deepseek-account', displayName: 'deepseek-account', settingsNs: 'llm-deepseek-account', settingsPath: [] },
      ])),
    }))
    const picker = screen.getByLabelText(en.providerSelect) as HTMLSelectElement
    expect([...picker.options].map(option => option.textContent)).toEqual([en.deepSeekAccount, 'DeepSeek'])
    await act(async () => { fireEvent.change(picker, { target: { value: 'deepseek-account' } }) })
    const seats = renderSlot.mock.calls.filter(call => call[0] === 'settings.models.provider-card')
    // A keyless route has no profile reference, so the seat reads the derived one.
    expect(seats.at(-1)?.[1]).toMatchObject({ keyConfigured: false })
  })

  it('starts over after a failed refresh of a loaded page', async () => {
    const scripted = scriptedFace()
    const { controller } = await mountPage(scripted)
    scripted.face.llm.listConfigurableProviders.mockImplementationOnce(
      () => Promise.resolve(remoteFail('directory down', 'gateway/internal')))
    await act(async () => { await controller.load() })
    expect(screen.getByText(/directory down/)).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByText(en.retry)) })
    await waitFor(() => { expect(screen.getByLabelText(en.providerSelect)).toBeTruthy() })
  })

  it('carries a declared route into the editor while credential state is unread', async () => {
    const namespaces = wireNamespaces().map(view => view.ns === 'llm-pi-ai'
      ? {
        ...view,
        value: { providers: { 'acme-gateway': { api: 'openai-completions', baseURL: 'https://acme.example/v1' } } },
        user: { providers: { 'acme-gateway': { api: 'openai-completions', baseURL: 'https://acme.example/v1' } } },
      }
      : view)
    const scripted = scriptedFace({}, {
      providers: () => Promise.resolve(remoteOk([{
        provider: 'acme-gateway', displayName: 'Acme', settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'acme-gateway'],
        declared: true, defaultBaseURL: 'https://acme.example/v1',
      }])),
      describeCredentials: () => Promise.resolve(remoteFail('credentials down')),
    })
    scripted.face.settings.describe.mockResolvedValue(remoteOk({ writable: true, hasDocument: false, namespaces }))
    await mountPage(scripted)
    // A declared route reaches this page's model editor — the one place its
    // models are managed — even while its credential state cannot be read.
    expect(screen.getByLabelText(en.customApi)).toBeTruthy()
    expect(screen.getAllByText('Acme').length).toBeGreaterThan(0)
  })

  it('carries a hand-declared route protocol and endpoint into the page editor', async () => {
    const namespaces = wireNamespaces().map(view => view.ns === 'llm-pi-ai'
      ? {
        ...view,
        value: { providers: { 'acme-gateway': { api: 'openai-completions', baseURL: 'https://acme.example/v1' } } },
        user: { providers: { 'acme-gateway': { api: 'openai-completions', baseURL: 'https://acme.example/v1' } } },
      }
      : view)
    const scripted = scriptedFace({}, {
      providers: () => Promise.resolve(remoteOk([{
        provider: 'acme-gateway', displayName: 'Acme', settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'acme-gateway'],
        declared: true, defaultBaseURL: 'https://acme.example/v1',
      }])),
    })
    scripted.face.settings.describe.mockResolvedValue(remoteOk({ writable: true, hasDocument: false, namespaces }))
    await mountPage(scripted)
    const protocol = screen.getByLabelText<HTMLSelectElement>(en.customApi)
    expect([...protocol.options].map(option => option.value)).toContain('openai-completions')
    await act(async () => { fireEvent.change(protocol, { target: { value: 'anthropic-messages' } }) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.apply })) })
    await waitFor(() => { expect(screen.getByRole('status')).toBeTruthy() })
  })

  it('drops a cleared endpoint back to the route default and names its key reference', async () => {
    await mountPage(scriptedFace())
    const endpoint = screen.getByLabelText<HTMLInputElement>(en.baseUrl)
    expect(endpoint.value).toBe('https://base')
    expect(screen.getByLabelText<HTMLInputElement>(en.keyInput).placeholder).toContain('DEEPSEEK_API_KEY')
    await act(async () => { fireEvent.change(endpoint, { target: { value: '' } }) })
    expect(endpoint.value).toBe('')
    expect(screen.getByLabelText<HTMLInputElement>(en.keyInput).placeholder).toContain('DEEPSEEK_API_KEY')
  })

  it('stays on the page when the editor is closed without a change', async () => {
    await mountPage(scriptedFace())
    fireEvent.click(screen.getByRole('button', { name: en.cancel }))
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByLabelText(en.providerSelect)).toBeTruthy()
  })
})
