/** Models section registration: slot declaration injection, the locale-following label thunk, and HMR recovery. */
import { Context } from '@noharness/cordis'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { resolveSlotLabel } from '@noharness/client-ui-slots'
import { SlotRegistry } from '@noharness/client-ui-renderer/client'
import { LocaleRuntime } from '@noharness/client-locale/client'
import { TestRemote } from '@noharness/client-test-runtime'
import { remoteDefaultResponses } from '@noharness/client-test-runtime/src/assembly/remote-default-responses.ts'
import { ok, RemoteMock } from '@noharness/remote-mock'
import { apply as settingsApply, inject as settingsInject } from '@noharness/client-ui-settings/client'
import { apply, inject, refreshIfLoaded } from '@noharness/client-ui-settings-models/client'
import { ModelsPage } from '../src/client/ModelsPage.tsx'
import { ProvidersSection } from '../src/client/ProvidersSection.tsx'

afterEach(() => { vi.unstubAllGlobals() })

// These specs assert the shipped English copy. The lane has no jsdom `window`,
// so browser-language detection never runs and bench pins the locale explicitly.

async function bench(mock = RemoteMock.create().load(remoteDefaultResponses), services: object = {}) {
  onTestFinished(() => { mock.assertNoUnmatched() })
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const locale = new LocaleRuntime(ctx)
  locale.setLocale('en')
  ctx.provide('locale', locale)
  const remote = new TestRemote(ctx, {
    credentials: {
      describe: vi.fn(() => Promise.resolve({ ok: true, value: {} })),
      set: vi.fn(),
      unset: vi.fn(),
    },
    llm: {
      listProviders: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
      listConfigurableProviders: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
      discoverModels: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
      ...services,
    },
    settings: mock.remote.settings,
    session: { initializeDefaultModel: vi.fn(async () => ({ ok: true, value: undefined })) },
  })
  await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
  return { ctx, slots: ctx.get('slots') as SlotRegistry, locale, remote }
}

function declare(slots: SlotRegistry): () => void {
  return slots.register(
    {
      name: 'root',
      children: {
        'settings.section': { kind: 'list', scope: 'root' },
      },
    } as never,
    () => null,
  )
}

describe('ui-settings-models apply', () => {
  it('declares the services it uses', () => {
    expect(inject).toEqual([
      'slots', 'locale', 'remote', 'remote.credentials', 'remote.llm', 'remote.settings', 'remote.session',
      'configForms', 'settingsSchema',
    ])
  })

  it('registers the models nav entry for declarations before or after apply', async () => {
    const before = await bench()
    declare(before.slots)
    await before.ctx.plugin({ inject: [...inject], apply }).await()
    const entry = before.slots.entries('settings.section')[1]!
    expect(before.slots.entries('settings.section').map(entry => entry.component)).toEqual([ProvidersSection, ModelsPage])
    expect(before.slots.entries('settings.section').map(entry => entry.options.id)).toEqual(['providers', 'models'])
    expect(entry.options).toMatchObject({ id: 'models', order: 10 })
    // The section claims its two extension seats in the same registration.
    expect(before.slots.spec('settings.models.provider-card')).toMatchObject({ kind: 'keyed', scope: 'root' })
    expect(before.slots.spec('settings.models.footer')).toMatchObject({ kind: 'list', scope: 'root' })
    // The nav label is a locale-following thunk; owners resolve at read time.
    expect(resolveSlotLabel(entry.options.label)).toBe('Models')
    const injected = (entry.inject as unknown as () => import('../src/client/ModelsSection.tsx').ModelsSectionInjected)()
    expect(injected.t('nav')).toBe('Models')
    expect(injected.t('deleteTitle')).toBe('Delete {provider}?')
    expect(typeof injected.controller.load).toBe('function')
    expect(injected.hooks.snapshot).toBe(injected.controller.store)
    expect(typeof injected.operations.writeSettings).toBe('function')

    const after = await bench()
    await after.ctx.plugin({ inject: [...inject], apply }).await()
    expect(after.slots.entries('settings.section')).toHaveLength(0)
    declare(after.slots)
    await Promise.resolve()
    expect(after.slots.entries('settings.section').map(entry => entry.component)).toEqual([ProvidersSection, ModelsPage])
    // The self-inflicted ledger notifications hit the duplicate guard.
    expect(after.slots.entries('settings.section')).toHaveLength(2)
  })

  it('the label thunk follows the active locale without re-registration', async () => {
    const b = await bench()
    declare(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    b.locale.setLocale('en')
    expect(b.slots.entries('settings.section').map(entry => resolveSlotLabel(entry.options.label))).toEqual(['Providers', 'Models'])
    const injected = b.slots.entries('settings.section')[1]!.inject as unknown as () => import('../src/client/ModelsSection.tsx').ModelsSectionInjected
    expect(injected().t('deleteTitle')).toBe('Delete {provider}?')
    b.locale.setLocale('en')
    expect(b.slots.entries('settings.section').map(entry => resolveSlotLabel(entry.options.label))).toEqual(['Providers', 'Models'])
    expect(injected().t('deleteTitle')).toBe('Delete {provider}?')
  })

  it('locale change while the slot is undeclared stays a no-op', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    b.locale.setLocale('en')
    expect(b.slots.entries('settings.section')).toHaveLength(0)
    b.locale.setLocale('en')
  })

  it('re-registers after an HMR collapse re-declares the slot (stale disposer must not block)', async () => {
    const b = await bench()
    const redeclare = declare(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    expect(b.slots.entries('settings.section')).toHaveLength(2)
    // Declarer unload: the cascade removes our entry while our local
    // disposer variable goes stale.
    redeclare()
    expect(b.slots.entries('settings.section')).toHaveLength(0)
    declare(b.slots)
    await Promise.resolve()
    expect(b.slots.entries('settings.section')[1]!.component).toBe(ModelsPage)
    // The locale path also recovers through the same ledger re-check.
    b.locale.setLocale('en')
    expect(b.slots.entries('settings.section').map(entry => resolveSlotLabel(entry.options.label))).toEqual(['Providers', 'Models'])
    b.locale.setLocale('en')
  })

  it('accepts extension entries under the declared seats and cascades them with the declarer', async () => {
    const b = await bench()
    declare(b.slots)
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    // A keyed card extension and a footer entry register through the ordinary
    // ledger once the section's registration declared the seats.
    const disposeCard = b.slots.register(
      { name: 'settings.models.provider-card', key: 'llm-pi-ai' } as never,
      () => null,
    )
    b.slots.register({ name: 'settings.models.footer', id: 'extra', order: 0 } as never, () => null)
    expect(b.slots.entries('settings.models.provider-card')).toHaveLength(1)
    expect(b.slots.entries('settings.models.footer')).toHaveLength(1)
    // Extension-side HMR safety: its own disposer removes the entry.
    disposeCard()
    expect(b.slots.entries('settings.models.provider-card')).toHaveLength(0)
    // Declarer unload cascades whatever extension entries remain.
    await fiber.dispose()
    expect(b.slots.entries('settings.models.footer')).toHaveLength(0)
  })

  it('registers the en nav dictionary and disposes everything with the fiber', async () => {
    const b = await bench()
    declare(b.slots)
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(b.locale.bind('settings.models')('nav')).toBe('Models')
    await fiber.dispose()
    expect(b.slots.entries('settings.section')).toHaveLength(0)
    // The (ns, locale) seats are free again — the dictionary disposers ran.
    expect(() => b.locale.register('settings.models', 'en', {})).not.toThrow()
  })
})

describe('pushed invalidations', () => {
  it('ignores invalidations before the page ever loaded', async () => {
    const b = await bench()
    declare(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    // The fake wire face has no methods: a fetch attempt would throw.
    b.remote.emit('settings/document-updated', ['llm-pi-ai', 1])
    b.remote.emit('credentials/reference-updated', ['OPENAI_API_KEY'])
    b.remote.emit('llm/adapters-updated', [])
    b.ctx.emit('connection/reset')
  })

  it('refreshes a loaded page and skips an idle one', () => {
    const loads: number[] = []
    const controller = {
      store: { getSnapshot: () => ({ status: 'ready' }) },
      load: () => { loads.push(1); return Promise.resolve() },
    }
    refreshIfLoaded(controller as import('../src/client/store.ts').ModelsSettingsStore)
    expect(loads).toHaveLength(1)
    const idle = {
      store: { getSnapshot: () => ({ status: 'idle' }) },
      load: () => { loads.push(2); return Promise.resolve() },
    }
    refreshIfLoaded(idle as import('../src/client/store.ts').ModelsSettingsStore)
    expect(loads).toHaveLength(1)
  })

  it('routes pushed credential invalidation into the shared provider join', async () => {
    const b = await bench()
    declare(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const entry = b.slots.entries('settings.section')
      .find(candidate => candidate.options.id === 'models')!
    const injected = (
      entry.inject as unknown as
      () => import('../src/client/ModelsSection.tsx').ModelsSectionInjected
    )()
    injected.controller.store.update((state) => { state.status = 'ready' })
    const load = vi.spyOn(injected.controller, 'load').mockResolvedValue()
    b.remote.emit('credentials/reference-updated', ['DEEPSEEK_API_KEY'])
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('joins the refreshed mirror view on a settings invalidation', async () => {
    const mock = RemoteMock.create().load(remoteDefaultResponses)
    const namespace = { ns: 'llm-test', schema: {}, value: {}, autoGenerate: true, applies: 'live' as const, secrets: [], revision: 1 }
    const document = { writable: true, hasDocument: false, namespaces: [namespace] }
    const describe = mock.remote.settings.describe
    describe.mockResolvedValue(ok(document))
    const listProviders = vi.fn(() => Promise.resolve({ ok: true as const, value: [] }))
    const b = await bench(mock, { listProviders })
    declare(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const entry = b.slots.entries('settings.section')
      .find(candidate => candidate.options.id === 'models')!
    const injected = (
      entry.inject as unknown as
      () => import('../src/client/ModelsSection.tsx').ModelsSectionInjected
    )()
    await injected.controller.load()
    expect(injected.hooks.snapshot.getSnapshot().namespaces.get('llm-test')?.revision).toBe(1)

    describe.mockResolvedValue(ok({ ...document, namespaces: [{ ...namespace, revision: 2 }] }))
    b.remote.emit('settings/document-updated', ['llm-test', 2])

    await vi.waitFor(() => {
      expect(injected.hooks.snapshot.getSnapshot().namespaces.get('llm-test')?.revision).toBe(2)
    })
    expect(describe).toHaveBeenCalledTimes(2)
  })
})
