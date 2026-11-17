/** Windows system tray: the always-present way back to a hidden window and the explicit quit entry. */

import { Menu, nativeImage, Tray } from 'electron'
import type { DesktopLocale } from './locale.ts'

/** Main-process actions the tray triggers; both run the same paths as the window and application menu. */
export interface DesktopTrayOptions {
  /** Multi-size ICO rendered by `scripts/render-tray-icon.ts`; Windows picks the bitmap for the display scale. */
  readonly iconPath: string
  readonly locale: () => DesktopLocale
  /** Show and focus the primary window. */
  readonly open: () => void
  /** Request quit through the same confirmation as every other quit entry. */
  readonly quit: () => void
}

/** Tray icon whose presence follows the shell preference, not only the window state. */
export class DesktopTray {
  private tray: Tray | undefined
  private shown: boolean | undefined

  /** @param options - Icon path, locale reader, and the open and quit actions. */
  constructor(private readonly options: DesktopTrayOptions) {}

  /**
   * Apply the shell preference; creating or removing the icon only on a change.
   * @param shown - Whether the tray icon belongs on screen for this run.
   */
  setShown(shown: boolean): void {
    if (shown === this.shown) return
    this.shown = shown
    const tray = this.tray
    if (!shown) {
      this.tray = undefined
      tray?.destroy()
      return
    }
    const created = new Tray(nativeImage.createFromPath(this.options.iconPath))
    this.tray = created
    created.on('click', () => { this.options.open() })
    this.relabel()
  }

  /** Rebuild the tooltip and context menu in the current locale. */
  relabel(): void {
    const tray = this.tray
    if (tray === undefined) return
    const { messages } = this.options.locale()
    tray.setToolTip(messages.aboutProduct)
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: messages.openApplication, click: () => { this.options.open() } },
      { type: 'separator' },
      { label: messages.quitApplication, click: () => { this.options.quit() } },
    ]))
  }

  /** Remove the icon; called once the quit is confirmed so no dead icon outlives the process. */
  dispose(): void {
    const tray = this.tray
    this.tray = undefined
    this.shown = undefined
    tray?.destroy()
  }
}
