/**
 * Settings shell contract — the types of the `sidebar.settings` occupant this
 * package renders. They live here rather than in ui-settings because they
 * reference the sidebar's own slot type: ui-settings is the settings domain's
 * base layer and must not depend on any `ui-*` presentation package, or the
 * reference graph closes a cycle through ui-sidebar → ui-layout → ui-theme.
 * The settings SLOT types (what registrants contribute) stay in ui-settings.
 */
import type { ConnectionState } from '@noharness/client-connection/client'
import type {
  HostObservable, InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime,
} from '@noharness/client-ui-slots'
// Type-only: pulls ui-sidebar's SlotMap merge (the 'sidebar.settings' entry)
// into every program that sees this contract.
import type {} from '@noharness/client-ui-sidebar/client'
// Type-only: pulls the settings slot declarations the shell renders into.
import type {} from '@noharness/client-ui-settings/client'
import type { PropsStore } from '@noharness/client-store'
import type { createSettingsShellStore } from './shell-store.ts'
import type { ShortcutCatalogEntry } from '@noharness/client-shortcuts/client'
import type { DesktopUpdateView } from '../types.ts'

/** One nav row projected from a settings.section registration's options. */
export interface SettingsSectionRow {
  id: string
  order: number
  label: string
}

/** One ordered onboarding step projected from a slot registration. */
export interface SettingsOnboardingStep {
  id: string
  order: number
}

/**
 * Registrant-private injected share of the settings shell (assembled in
 * apply): connection state and ledger projections arrive as hook-compartment
 * sources, while the reconnect command remains a plain callback.
 */
export type SettingsRootInjected = {
  /** Request the current shell-owned update action. */
  openDesktopUpdate: () => void
  /**
   * Select the settings page. A section opens it there; a call without one
   * leaves the center column to the onboarding step that just took it.
   */
  openSettings: (sectionId?: string) => void
  /** Select the settings page without naming a section: the trigger's own path. */
  showSettingsPage: () => void
  /** Return the center column to the Conversation. */
  closeSettings: () => void
  /** Request a fresh logical generation and physical WebSocket immediately. */
  reconnect: () => void
  hooks: {
    /** Effective command presentation, shared with the reference. */
    shortcuts: HostObservable<readonly ShortcutCatalogEntry[]>
    /** Shared Electron status for both sidebar locations. */
    desktopUpdate: HostObservable<DesktopUpdateView>
    /** Connection-owned state for the current Host connection. */
    connectionState: HostObservable<ConnectionState | undefined>
    /** settings.section ledger projected into ordered nav rows. */
    sections: HostObservable<readonly SettingsSectionRow[]>
    /** settings.onboarding ledger projected into coordinator order. */
    onboardingSteps: HostObservable<readonly SettingsOnboardingStep[]>
    /** ui-layout's selected center-column panel; the shell opens by selecting it. */
    panelInfo: HostObservable<{ readonly activePanelId: string | null }>
  }
}

/**
 * Full component props of the settings shell root: the sidebar owner share
 * (wide/rail state) plus the declared render shares and the injected face
 * (hooks compartment bound to useSections). The declared store shares section
 * selection with the center-column page; page visibility is ui-layout's panel
 * selection.
 */
export type SettingsRootComponentProps =
  PropsRuntime<'sidebar.settings'>
  & PropsRenderSlots<
    | 'settings.launcher'
    | 'settings.trigger'
    | 'settings.onboarding'
  >
  & InjectFace<SettingsRootInjected>
  & PropsLocale<'settings'>
  & PropsStore<ReturnType<typeof createSettingsShellStore>>

/** Injected face of the center-column page: section rail writes and the close path. */
export interface SettingsPageInjected {
  /** @param id - section row the rail selects. */
  select: (id: string) => void
  /** Return the center column to the Conversation. */
  close: () => void
  hooks: {
    /** settings.section ledger projected into ordered nav rows. */
    sections: HostObservable<readonly SettingsSectionRow[]>
  }
}
