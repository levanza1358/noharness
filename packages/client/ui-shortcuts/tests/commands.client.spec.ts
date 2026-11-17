// @vitest-environment jsdom
import { describe, expect, onTestFinished, vi } from 'vitest'
import { createElement, useSyncExternalStore } from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { createClientTest, webApp } from '@noharness/client-test-runtime/src/assembly/index.ts'
import { Modal } from '@noharness/client-ui-primitives'
import type {} from '@noharness/client-shortcuts/client'
import type { DesktopKeyboardApi, DesktopShortcutInput, ShortcutCommandId } from '@noharness/client-shortcuts/protocol'
import type { createSettingsShellStore } from '../../ui-settings-general/src/client/shell-store.ts'
import type { createLayoutStore } from '../../ui-layout/src/client/stores.ts'
import { SETTINGS_PANEL_ID } from '../../ui-settings-general/src/client/SettingsPage.tsx'
import type { ReferenceInjected } from '../src/client/Reference.tsx'
import type { createShortcutsStore } from '../src/client/store.ts'

const it = createClientTest({ roster: webApp })

describe('assembled shortcut command owners', () => {
  it('keeps desktop defaults out of Web and removes commands on owner unload', async ({ start }) => {
    const client = await start()
    const shortcuts = client.ctx.shortcuts
    const overlay = client.ctx.slots.entries('shell.overlay').find(entry => entry.options.id === 'shortcuts')!
    const injected: Partial<ReferenceInjected> | undefined = overlay.inject?.()
    if (injected?.hooks === undefined || injected.describeBinding === undefined
      || injected.recording === undefined || injected.edit === undefined) {
      throw new Error('expected the shortcut reference actions')
    }
    expect(injected.hooks.catalog).toBe(shortcuts.catalog)
    await vi.waitFor(() => { expect(shortcuts.config.getSnapshot().status).toBe('ready') })
    expect(injected.describeBinding(null).keys).toEqual([])
    await injected.recording(false)
    const shortcut = shortcuts.catalog.getSnapshot().find(row => row.id === 'shortcuts.open')!
    expect((await injected.edit({ type: 'reset', id: shortcut.id }, shortcuts.config.getSnapshot().revision)).status).toBe('saved')
    const row = client.ctx.slots.entries('settings.general.item').find(entry => entry.options.id === 'shortcuts')!
    const rowInjected: Partial<ReferenceInjected> | undefined = row.inject?.()
    expect(rowInjected?.hooks?.catalog).toBe(shortcuts.catalog)
    const ownerIds = ['settings.open', 'shortcuts.open', 'sidebar.left.toggle']
    const ownedRows = () => shortcuts.catalog.getSnapshot().filter(row => ownerIds.includes(row.id))
    expect(ownedRows().map(row => row.id).sort()).toEqual(ownerIds)
    expect(ownedRows().filter(row => row.keys.length > 0).map(row => row.id)).toEqual(['shortcuts.open'])
    const conversationIds = ['fixed.send', 'fixed.newline', 'fixed.complementary', 'fixed.slash', 'fixed.mention', 'response.stop']
    const fixedIds = () => shortcuts.fixedCatalog.getSnapshot().map(row => row.id)
    expect(fixedIds()).toEqual(expect.arrayContaining(conversationIds))
    expect(shortcuts.fixedCatalog.getSnapshot().find(row => row.id === 'response.stop'))
      .toMatchObject({ group: 'input', keys: ['Esc', 'Esc'] })
    await client.unload('@noharness/client-ui-shortcuts')
    expect(fixedIds()).toEqual(expect.arrayContaining(conversationIds))
    expect(fixedIds()).not.toContain('fixed.move')
    await client.unload('@noharness/client-ui-conversation')
    for (const id of conversationIds) expect(fixedIds()).not.toContain(id)
    for (const owner of ['ui-settings-general', 'ui-layout']) await client.unload(`@noharness/client-${owner}`)
    expect(ownedRows()).toEqual([])
    expect(shortcuts.fixedCatalog.getSnapshot().some(row => row.id.startsWith('fixed.'))).toBe(false)
  }, 60_000)

  it('toggles the shortcut dialog, keeps the settings page out of its way, and blocks shortcuts behind ambient modals', async ({ start }) => {
    const previous = document.documentElement.dataset.platform
    const previousBridge = Object.getOwnPropertyDescriptor(window, 'nhsDesktop')
    const listeners = new Set<(input: DesktopShortcutInput) => void>()
    const keyboard: DesktopKeyboardApi = {
      subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
      closeWindow: async () => {},
    }
    Object.defineProperty(window, 'nhsDesktop', { configurable: true, value: { keyboard } })
    document.documentElement.dataset.platform = 'darwin'
    const modal = document.createElement('div')
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    onTestFinished(() => {
      cleanup()
      modal.remove()
      if (previousBridge === undefined) Reflect.deleteProperty(window, 'nhsDesktop')
      else Object.defineProperty(window, 'nhsDesktop', previousBridge)
      if (previous === undefined) delete document.documentElement.dataset.platform
      else document.documentElement.dataset.platform = previous
    })
    const client = await start()
    const shortcuts = client.ctx.shortcuts
    const settings = (client.ctx.slots.entries('sidebar.settings')[0]!.store as ReturnType<typeof createSettingsShellStore>).create()
    const reference = (client.ctx.slots.entries('shell.overlay').find(entry => entry.options.id === 'shortcuts')!.store as ReturnType<typeof createShortcutsStore>).create()
    const layout = (client.ctx.slots.entries('root')[0]!.store as ReturnType<typeof createLayoutStore>).create()
    function Dialogs() {
      const referenceState = useSyncExternalStore(listener => reference.subscribe(listener), () => reference.getSnapshot())
      return createElement(Modal, { open: referenceState.open, title: 'Shortcuts', closeLabel: 'Close shortcuts',
        shortcutModal: 'shortcuts', onClose: reference.actions.close })
    }
    render(createElement(Dialogs))
    const press = (code: string, repeat = false): void => {
      act(() => {
        for (const listener of listeners) listener({ kind: 'keyboard', revision: shortcuts.config.getSnapshot().revision,
          frameName: '', code, control: false, alt: false, shift: false, meta: true, repeat })
      })
    }
    // Settings is a center-column page: the shortcut selects it without a
    // dialog, and a repeat changes nothing.
    const openSettings = () => { act(() => { client.ctx.layout.selectPanel(SETTINGS_PANEL_ID) }) }
    press('Comma')
    openSettings()
    expect(client.ctx.layout.panelInfo.getSnapshot().activePanelId).toBe(SETTINGS_PANEL_ID)
    press('Comma', true)
    act(() => { settings.actions.select('general') })
    const selected = settings.getSnapshot()
    press('Slash')
    expect(reference.getSnapshot().open).toBe(true)
    act(() => { reference.actions.search('session') })
    const searched = reference.getSnapshot()
    press('Slash', true)
    press('Comma')
    expect(settings.getSnapshot()).toBe(selected)
    expect(reference.getSnapshot()).toBe(searched)

    document.body.append(modal)
    press('Comma')
    press('Slash')
    expect(settings.getSnapshot()).toBe(selected)
    expect(reference.getSnapshot()).toBe(searched)
    modal.remove()

    press('Slash')
    expect(reference.getSnapshot()).toMatchObject({ open: false, query: '' })
    expect(settings.getSnapshot()).toBe(selected)
    const sidebar = layout.getSnapshot().layoutInfo.sidebar
    // KeyB belongs to the sidebar owner; the reference dialog keeps it for itself.
    press('Slash')
    expect(reference.getSnapshot().open).toBe(true)
    press('KeyB')
    expect(layout.getSnapshot().layoutInfo.sidebar).toBe(sidebar)
    press('Slash')
    expect(reference.getSnapshot().open).toBe(false)
    press('KeyB')
    expect(layout.getSnapshot().layoutInfo.sidebar).not.toBe(sidebar)
    press('KeyB', true)
    expect(layout.getSnapshot().layoutInfo.sidebar).not.toBe(sidebar)
    press('KeyB')
    expect(layout.getSnapshot().layoutInfo.sidebar).toBe(sidebar)
    const menu = (commandId: ShortcutCommandId): void => {
      act(() => {
        for (const listener of listeners) listener({ kind: 'menu', commandId, revision: shortcuts.config.getSnapshot().revision })
      })
    }
    // A menu command for the page selects it; while another modal owns the
    // keys, the same command dismisses that modal instead.
    menu('settings.open' as ShortcutCommandId)
    expect(client.ctx.layout.panelInfo.getSnapshot().activePanelId).toBe(SETTINGS_PANEL_ID)
    menu('shortcuts.open' as ShortcutCommandId)
    expect(reference.getSnapshot().open).toBe(true)
    // The page owns the keyboard again once the dialog is gone.
    press('Escape')
  })
})
