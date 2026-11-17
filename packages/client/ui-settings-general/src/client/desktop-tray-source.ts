/** Shell-owned tray preference held by the Desktop process. */
import { createSnapshotStore } from '@noharness/client-store'
import type { DesktopShellPreferenceBridge } from '../types.ts'

/** Current choice plus transient write feedback. */
export interface DesktopTraySnapshot {
  enabled: boolean
  failed: boolean
  pending: boolean
}

/** Client observation; the Electron tray itself is reached only through the bridge. */
export class DesktopTraySource {
  /** Stable observation shared by every mounted General view. */
  readonly store = createSnapshotStore<DesktopTraySnapshot>({ enabled: true, failed: false, pending: false })
  private live = true
  /** Set by {@link dispose}; lets a late IPC response stop without touching the store. */
  private disposed = false
  private revision = 0
  private readonly unsubscribe: () => void

  /** @param bridge - Isolated shell API, present only in Desktop. */
  constructor(private readonly bridge: DesktopShellPreferenceBridge) {
    this.unsubscribe = bridge.subscribe((enabled) => {
      if (!this.live) return
      this.revision++
      this.store.set({ enabled, failed: false, pending: false })
    })
    void bridge.get().then((enabled) => {
      if (this.live && this.revision === 0) this.store.set({ ...this.store.getSnapshot(), enabled })
    }, () => {
      if (this.live && this.revision === 0) this.store.set({ ...this.store.getSnapshot(), failed: true })
    })
  }

  /**
   * Persist and apply one explicit choice.
   * @param enabled - Whether the tray icon belongs on screen.
   * @returns After the shell reports the outcome; failure keeps the previous state.
   */
  async set(enabled: boolean): Promise<void> {
    if (!this.live) return
    const revision = this.revision
    this.store.set({ ...this.store.getSnapshot(), pending: true, failed: false })
    let failed = false
    try {
      await this.bridge.set(enabled)
    } catch (_error) {
      // The write may have failed after the document was replaced; the shell
      // reports no confirmed state, so the previous choice stands.
      failed = true
    }
    if (this.disposed) return
    const accepted = !failed && revision === this.revision
    this.store.set({ ...this.store.getSnapshot(), pending: false, failed,
      ...(accepted ? { enabled } : {}) })
  }

  /** Detach the shell subscription and ignore late IPC responses. */
  dispose(): void { this.live = false; this.disposed = true; this.unsubscribe() }
}
