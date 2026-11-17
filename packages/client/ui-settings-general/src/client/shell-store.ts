/** Shared settings viewing state for its mouse and command entry points. */

import { defineStore, type EngineStoreHandle } from '@noharness/client-store'

type State = { activeId: string | undefined }
type Actions = {
  select(draft: State, id: string): void
  openSection(draft: State, id: string): void
}

/**
 * Declare the settings page section state and its complete mutation API. The
 * page's visibility is ui-layout's center-column selection, not this store.
 * @returns one root-scoped store handle for the settings shell.
 */
export function createSettingsShellStore(): EngineStoreHandle<State, Actions> {
  return defineStore({
    init: (): State => ({ activeId: undefined as string | undefined }),
    actions: {
      select: (d, id: string) => { d.activeId = id },
      openSection: (d, id: string) => { d.activeId = id },
    },
  })
}
