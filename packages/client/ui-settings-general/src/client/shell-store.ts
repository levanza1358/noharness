/** Shared settings viewing state for its mouse and command entry points. */

import { defineStore, type EngineStoreHandle } from '@noharness/client-store'

/** One section row the navigation renders; the page keeps reading the slot ledger. */
export interface SettingsNavigationRow {
  readonly id: string
  readonly label: string
}

type State = {
  activeId: string | undefined
  /** Ordered projection of the settings.section ledger, kept current by the shell. */
  rows: readonly SettingsNavigationRow[]
}
type Actions = {
  select(draft: State, id: string): void
  openSection(draft: State, id: string): void
  setRows(draft: State, rows: readonly SettingsNavigationRow[]): void
}

/**
 * Declare the settings page section state and its complete mutation API. The
 * page's visibility is ui-layout's center-column selection, not this store.
 * @returns one root-scoped store handle for the settings shell.
 */
export function createSettingsShellStore(): EngineStoreHandle<State, Actions> {
  return defineStore({
    init: (): State => ({ activeId: undefined as string | undefined, rows: [] }),
    actions: {
      select: (d, id: string) => { d.activeId = id },
      openSection: (d, id: string) => { d.activeId = id },
      setRows: (d, rows: readonly SettingsNavigationRow[]) => { d.rows = rows },
    },
  })
}
