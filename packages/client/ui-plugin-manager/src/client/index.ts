/**
 * Plugin manager, browser half: the **Plugins** entry of the sidebar and the
 * management page it opens in the main column. The page installs, enables,
 * disables, and removes the bundles of the Host's profile through the
 * `pluginManager` Remote and switches their rows in the profile's user layer.
 * A plugin that carries its own configuration renders it on this page through
 * the slots the page declares (`slot-contract.ts`).
 */
import type {} from '@noharness/client-product-analytics/client'
import type {} from '@noharness/client-locale/client'
import type { Context as ClientContext } from '@noharness/cordis'
// Type-only: the settings section slot the page registers into, declared by
// ui-settings, and the sidebar contract the page's icons reuse.
import type { HostObservable } from '@noharness/client-ui-slots'
import type {} from '@noharness/client-ui-sidebar/client'
import type {} from '@noharness/client-ui-renderer/client'
// Type-only: the ctx.remoteAccess Context merge.
import type {} from '@noharness/api-remote-access/client'
// Type-only: the ctx.remote Context merge and the forwarded-event key face.
import type {} from '@noharness/api-remotes/client'
// Type-only: the forwarded events' own declaration (`$on`'s key face resolves
// through the owning package's client-safe types subpath).
import type {} from '@noharness/plugin-manager/types'
import { PluginManagerPage } from './PluginManagerPage.tsx'
import { createPluginHeaderRef } from './header-scroll.ts'
import { PluginRefreshToast, type PluginRefreshToastFace } from './PluginRefreshToast.tsx'
import { configLedgerSource } from './config-ledger.ts'
import { tabLedgerSource } from './tab-ledger.ts'
import { PluginManagerController } from './manager-store.ts'
import { en, ja, es, fr, de, ru, pt, type PluginManagerLocaleKey } from './locales.ts'
import { createNavigationStore } from './navigation-store.ts'
import type {} from './slot-contract.ts'

declare module '@noharness/cordis' {
  interface Context {
    /** Read-only management activity, independent of the visible Plugins page. */
    pluginChanges: {
      /**
       * Observe whether a bundle or one of its rows is being changed.
       * @param packageName Bundle package name.
       * @returns A snapshot source whose subscriptions belong to the caller.
       */
      bundle(packageName: string): HostObservable<boolean>
    }

    /** Cross-plugin navigation to the Plugins panel. */
    pluginNavigation: {
      /**
       * Open a bundle's details without changing the current Session.
       * An absent bundle displays the plugin list after loading.
       * @param packageName - npm package name of the bundle.
       */
      openBundle(packageName: string): void
      /** Open the Plugins main list without opening a dialog or changing the current Session. */
      openList(): void
    }
  }
}

export type { PluginManagerPageProps } from './PluginManagerPage.tsx'
export type { ConfigLedger, OfficialItem } from './config-ledger.ts'
export type { PluginManagerFace } from './manager-store.ts'
export type { PluginManagerLocaleKey } from './locales.ts'
export type {
  ConfigPageForm, PluginActivationOwnerProps, PluginAddActionsProps, PluginTabInstall, PluginTabProps, PluginTabUpdate,
  PluginConfigViewProps, PluginDetailProps, PluginPackageRef, PluginRowRef, PluginsSubject,
} from './slot-contract.ts'

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Plugin manager tab copy. */
    'pluginManager': PluginManagerLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'pluginManager'

/** The id shared by the sidebar entry and the main panel it opens. */
/** Settings section this page occupies; the section is its only entry. */
export const SECTION_ID = 'plugin-manager'

/** Services required by the sidebar registration, the Remote methods, and access; the inventory says whether the Host manages a profile. */
export const inject = ['slots', 'locale', 'remote', 'remote.pluginManager', 'remote.pluginInventory', 'remote.pluginRegistryProbe', 'configForms', 'layout', 'remoteAccess']

/**
 * Contribute the Plugins entry to the sidebar with the management page it
 * opens, and keep it current on the Host's change events, while the current
 * Peer may list the installed bundles.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, ja, es, fr, de, ru, pt }), 'ui-plugin-manager: dictionaries')
  const t = ctx.locale.bind(NS)
  const controller = new PluginManagerController(ctx)
  ctx.effect(() => () => { controller.dispose() }, 'ui-plugin-manager: controller')
  ctx.provide('pluginChanges', { bundle: packageName => controller.observeChanges(packageName) })
  // The page is a global panel: it belongs to the profile, not to a Session,
  // and the sidebar's entry selects it. What is installed and switched on is
  // the page's own; a plugin's configuration arrives through the slots the
  // page declares here, so the page never names a configurable plugin.
  const configLedger = configLedgerSource(ctx)
  const face = controller.inject(configLedger, tabLedgerSource(ctx), text => ctx.locale.resolveText(text))
  ctx.remoteAccess.whenAccess('pluginManager/listBundles', function* () {
    // The Host says when what is installed, enabled, or composed changed — from
    // this page, the CLI, or another browser — and streams install output.
    // A page never rendered holds no snapshot to refresh.
    const refresh = (): void => {
      // A profile change can replace a bundle's files, and a restarted Host is read afresh.
      controller.details.reset()
      if (controller.getSnapshot().status !== 'idle') void controller.load()
    }
    // Host changes made while access was withdrawn reached no subscription below.
    refresh()
    yield ctx.remote.$on('plugin-manager/changed', refresh)
    yield ctx.remote.$on('plugin-manager/install-log', (chunk) => { controller.appendLog(chunk) })
    yield ctx.remote.$on('plugin-manager/install-state', (progress) => { controller.installProgress(progress) })
    yield ctx.remote.$on('plugin-manager/update-state', (progress) => { controller.updateProgress(progress) })
    yield ctx.on('connection/reset', refresh)
    yield ctx.slots.inject('shell.overlay', () => ctx.slots.register({
      name: 'shell.overlay', id: 'plugin-manager.refresh-toast', locale: NS,
      inject: (): PluginRefreshToastFace => ({
        hooks: { pluginManager: face.hooks.pluginManager },
        dismissNotice: face.dismissNotice,
      }),
    }, PluginRefreshToast))
    yield ctx.slots.inject('settings.section', function* () {
      const handle = createNavigationStore(), instance = handle.create()
      const store: typeof handle = { ...handle, create: () => instance }
      yield ctx.slots.register({
        name: 'settings.section',
        id: SECTION_ID,
        order: 18,
        label: () => t('panel'),
        locale: NS,
        store,
        inject: () => ({ ...face, createHeaderRef: createPluginHeaderRef }),
        children: {
          'plugins.add.actions': { kind: 'list', scope: 'root' },
          'plugins.tab': { kind: 'list', scope: 'root' },
          'plugins.item': { kind: 'list', scope: 'root' },
          'plugins.bundle.activation': { kind: 'keyed', scope: 'root' },
          'plugins.bundle.config': { kind: 'keyed', scope: 'root' },
          'plugins.row.config': { kind: 'keyed', scope: 'root' },
          'plugins.detail.actions': { kind: 'list', scope: 'root' },
          'plugins.detail.badge': { kind: 'list', scope: 'root' },
          'plugins.detail.section': { kind: 'list', scope: 'root' },
        },
      }, PluginManagerPage)
      // Leaving Settings resets the section to its list; a section switch keeps
      // the view the reader chose.
      yield ctx.layout.panelInfo.subscribe(() => {
        if (String(ctx.layout.panelInfo.getSnapshot().activePanelId ?? '') !== 'settings') {
          instance.actions.setView({ kind: 'list' })
        }
      })
      const disposeNavigation = ctx.reflect.provide('pluginNavigation', {
        openList: () => {
          ctx.get('settingsNavigation')?.open(SECTION_ID)
          instance.actions.setTab('installed')
          instance.actions.setView({ kind: 'list' })
        },
        openBundle: (packageName: string) => {
          ctx.get('settingsNavigation')?.open(SECTION_ID)
          instance.actions.setTab('installed')
          instance.actions.setView({ kind: 'package', name: packageName })
        },
      })
      yield () => { void disposeNavigation() }
    })
  })
}
