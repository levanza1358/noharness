// @vitest-environment jsdom
/** The Providers page: naming a provider in a dialog, then the settings form behind it. */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@noharness/client-test-runtime'
import { SettingsDescribeMirror } from '@noharness/client-ui-settings/src/client/settings-mirror.ts'
import { ProvidersSection } from '../src/client/ProvidersSection.tsx'
import { ModelsSettingsStore } from '../src/client/store.ts'
import { en } from '../src/client/locales.ts'
import { ctxWith, operationsWith, scriptedFace } from './page-fixture.client.ts'
import { settingsSchema } from './settings-schema.client.ts'

afterEach(cleanup)

const t = (key: keyof typeof en): string => en[key]

async function mountPage(scripted: ReturnType<typeof scriptedFace>, load = true) {
  const { face } = scripted
  const ctx = ctxWith(face)
  const controller = new ModelsSettingsStore(ctx, settingsSchema, new SettingsDescribeMirror(ctx))
  if (load) await controller.load()
  render(<ProvidersSection
    controller={controller}
    useSnapshot={bindSnapshotSelector(controller.store)}
    operations={operationsWith(face)}
    schema={settingsSchema}
    t={t}
  />)
  return { controller }
}

/** The add button, the dialog fields, and its Continue action. */
const addButton = (): HTMLButtonElement => screen.getByRole('button', { name: en.add }) as HTMLButtonElement
const proceed = (): HTMLButtonElement => screen.getByRole('button', { name: en.nameContinue }) as HTMLButtonElement

describe('ProvidersSection', () => {
  it('names the provider in a dialog, then opens the settings form for it', async () => {
    await mountPage(scriptedFace())
    expect(screen.getByRole('heading', { name: en.providersTitle })).toBeTruthy()
    expect(screen.getByText(en.providersIntro)).toBeTruthy()
    fireEvent.click(addButton())
    expect(screen.getByRole('dialog', { name: en.nameTitle })).toBeTruthy()
    expect(screen.getByText(en.nameDescription)).toBeTruthy()
    await act(async () => {
      fireEvent.change(screen.getByLabelText(en.customRoute), { target: { value: 'acme-gateway' } })
      fireEvent.change(screen.getByLabelText(en.nameLabel), { target: { value: 'Acme' } })
    })
    expect(proceed().disabled).toBe(false)
    await act(async () => { fireEvent.click(proceed()) })
    await waitFor(() => { expect(screen.queryByRole('dialog', { name: en.nameTitle })).toBeNull() })
    expect(screen.getByLabelText<HTMLInputElement>(en.customRoute).value).toBe('acme-gateway')
    expect(screen.getByLabelText<HTMLInputElement>(en.customDisplayName).value).toBe('Acme')
  })

  it('keeps Continue disabled until the route id is new and well formed', async () => {
    await mountPage(scriptedFace())
    fireEvent.click(addButton())
    expect(proceed().disabled).toBe(true)
    await act(async () => { fireEvent.change(screen.getByLabelText(en.customRoute), { target: { value: '1bad' } }) })
    expect(screen.getByText(en.customRouteInvalid)).toBeTruthy()
    expect(proceed().disabled).toBe(true)
    await act(async () => { fireEvent.change(screen.getByLabelText(en.customRoute), { target: { value: 'openai' } }) })
    expect(screen.getByText(en.customRouteTaken)).toBeTruthy()
    expect(proceed().disabled).toBe(true)
    expect(screen.queryByText(en.customRouteHint)).toBeNull()
  })

  it('closes the dialog without opening a form', async () => {
    await mountPage(scriptedFace())
    fireEvent.click(addButton())
    fireEvent.click(screen.getByRole('button', { name: en.cancel }))
    await waitFor(() => { expect(screen.queryByRole('dialog', { name: en.nameTitle })).toBeNull() })
    expect(addButton()).toBeTruthy()
    expect(screen.queryByLabelText(en.baseUrl)).toBeNull()
  })

  it('states a read-only deployment and disables the button', async () => {
    const scripted = scriptedFace()
    scripted.face.settings.describe.mockResolvedValue({ ok: true, value: {
      writable: false, hasDocument: true, namespaces: [],
    } })
    const controller = new ModelsSettingsStore(ctxWith(scripted.face), settingsSchema, new SettingsDescribeMirror(ctxWith(scripted.face)))
    await controller.load()
    render(<ProvidersSection
      controller={controller}
      useSnapshot={bindSnapshotSelector(controller.store)}
      operations={operationsWith(scripted.face)}
      schema={settingsSchema}
      t={t}
    />)
    expect(screen.getByText(en.readOnly)).toBeTruthy()
    expect(addButton().disabled).toBe(true)
  })

  it('loads the directory on its own when it mounts idle', async () => {
    const scripted = scriptedFace()
    const { controller } = await mountPage(scripted, false)
    await waitFor(() => { expect(controller.store.getSnapshot().status).toBe('ready') })
    expect(addButton().disabled).toBe(false)
  })

  it('renders nothing before the shell injects', () => {
    expect(render(<ProvidersSection />).container.innerHTML).toBe('')
  })

  it('names the route when the display name is left blank', async () => {
    await mountPage(scriptedFace())
    fireEvent.click(addButton())
    await act(async () => { fireEvent.change(screen.getByLabelText(en.customRoute), { target: { value: 'acme-gateway' } }) })
    await act(async () => { fireEvent.click(proceed()) })
    await waitFor(() => { expect(screen.queryByRole('dialog', { name: en.nameTitle })).toBeNull() })
    expect(screen.getByLabelText<HTMLInputElement>(en.customDisplayName).value).toBe('acme-gateway')
  })

  it('closes the dialog from its close control', async () => {
    await mountPage(scriptedFace())
    fireEvent.click(addButton())
    fireEvent.click(screen.getByRole('button', { name: en.close }))
    await waitFor(() => { expect(screen.queryByRole('dialog', { name: en.nameTitle })).toBeNull() })
    expect(screen.queryByLabelText(en.baseUrl)).toBeNull()
  })

  it('reloads the directory after the created provider is written', async () => {
    const scripted = scriptedFace()
    const { controller } = await mountPage(scripted)
    const load = vi.spyOn(controller, 'load')
    fireEvent.click(addButton())
    await act(async () => { fireEvent.change(screen.getByLabelText(en.customRoute), { target: { value: 'acme-gateway' } }) })
    await act(async () => { fireEvent.click(proceed()) })
    await act(async () => {
      fireEvent.change(screen.getByLabelText(en.baseUrl), { target: { value: 'https://gateway.example/v1' } })
      fireEvent.change(screen.getByLabelText(en.keyInput), { target: { value: 'test-key' } })
    })
    fireEvent.click(screen.getByRole('button', { name: en.addModel }))
    fireEvent.change(screen.getByLabelText(`${en.modelId} 1`), { target: { value: 'model' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.create })) })
    await waitFor(() => { expect(load).toHaveBeenCalled() })
    await waitFor(() => { expect(screen.queryByRole('button', { name: en.create })).toBeNull() })
    expect(addButton()).toBeTruthy()
  })

  it('drops the form when its card is cancelled without a write', async () => {
    await mountPage(scriptedFace())
    fireEvent.click(addButton())
    await act(async () => { fireEvent.change(screen.getByLabelText(en.customRoute), { target: { value: 'acme-gateway' } }) })
    await act(async () => { fireEvent.click(proceed()) })
    await waitFor(() => { expect(screen.getByLabelText(en.customDisplayName)).toBeTruthy() })
    fireEvent.click(screen.getByRole('button', { name: en.cancel }))
    await waitFor(() => { expect(screen.queryByLabelText(en.customDisplayName)).toBeNull() })
    expect(addButton()).toBeTruthy()
  })
})
