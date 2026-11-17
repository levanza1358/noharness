/** Shell-owned LAN exposure held by the Desktop process. */
import { createSnapshotStore } from '@noharness/client-store'
import type { DesktopNetworkExposureBridge, DesktopNetworkExposureView } from '../types.ts'

/** Client observation; the proxy itself is reached only through the bridge. */
export class DesktopNetworkSource {
  /** Stable observation shared by every mounted General view. */
  readonly store = createSnapshotStore<DesktopNetworkExposureView>({ enabled: false, failed: false, pending: false })
  private live = true
  /** Set by {@link dispose}; lets a late IPC response stop without touching the store. */
  private disposed = false
  private revision = 0
  private readonly unsubscribe: () => void

  /** @param bridge - Isolated shell API, present only in Desktop. */
  constructor(private readonly bridge: DesktopNetworkExposureBridge) {
    this.unsubscribe = bridge.subscribe((state) => {
      if (!this.live) return
      this.revision++
      this.store.set(state)
    })
    void bridge.get().then((state) => {
      if (this.live && this.revision === 0) this.store.set(state)
    }, () => {
      if (this.live && this.revision === 0) this.store.set({ ...this.store.getSnapshot(), failed: true })
    })
  }

  /**
   * Ask the shell to start or stop the LAN proxy.
   * @param enabled - Whether other machines should reach this Host.
   * @returns After the shell reports the outcome; failure keeps the previous state.
   */
  async set(enabled: boolean): Promise<void> {
    if (!this.live) return
    const revision = this.revision
    this.store.set({ ...this.store.getSnapshot(), pending: true, failed: false })
    let next: DesktopNetworkExposureView | undefined
    try {
      next = await this.bridge.set(enabled)
    } catch (_error) {
      // The shell may have failed after the document was replaced; no
      // confirmed state exists, so the previous choice stands.
      next = undefined
    }
    if (this.disposed) return
    if (next === undefined) {
      this.store.set({ ...this.store.getSnapshot(), pending: false, failed: true })
      return
    }
    if (revision === this.revision) this.store.set(next)
    else this.store.set({ ...this.store.getSnapshot(), pending: false })
  }

  /** Detach the shell subscription and ignore late IPC responses. */
  dispose(): void { this.live = false; this.disposed = true; this.unsubscribe() }
}
