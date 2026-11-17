/** Startup policy for optional Electron shell preferences, independent of the Host. */
import { DesktopSettingsFile, type DesktopUpdatePreferences } from './settings-file.ts'

/** Resolved shell preferences read once at startup. */
export interface DesktopSettings {
  readonly updates: Pick<DesktopUpdatePreferences, 'allowTestAuthPopupWindow'>
  readonly shell: { readonly tray: boolean; readonly network: boolean }
}

/**
 * Initialize the shared document explicitly at startup, then resolve the shell preferences.
 * @param userData - Electron userData, independent of NHS_HOME.
 * @returns Validated preferences, or their defaults with a diagnostic when the document cannot be read.
 */
export async function readDesktopSettings(userData: string): Promise<DesktopSettings> {
  const file = new DesktopSettingsFile(userData)
  const result = await file.initialize()
  const fields = result.kind === 'ready' ? result.fields : undefined
  const preference = fields?.allowTestAuthPopupWindow
  const tray = fields?.trayEnabled
  const network = fields?.exposedNetwork
  const error = result.kind === 'error' ? result.error : preference?.kind === 'invalid' ? preference.error : undefined
  if (error) {
    try { console.warn(`desktop settings: ${file.path}: using defaults because settings could not be loaded`, error) } catch (_logError) {
      // Optional shell settings keep their defaults even when diagnostic output is unavailable.
    }
  }
  return {
    updates: { allowTestAuthPopupWindow: preference?.kind === 'valid' && preference.value },
    shell: { tray: tray?.kind === 'valid' ? tray.value : true, network: network?.kind === 'valid' && network.value },
  }
}

/**
 * Persist the tray preference without touching any other stored field.
 * @param userData - Electron userData, the same directory startup reads.
 * @param enabled - Whether the tray icon belongs on screen.
 * @returns After the document holds the choice.
 */
export async function saveShellTray(userData: string, enabled: boolean): Promise<void> {
  await new DesktopSettingsFile(userData).saveUpdates({ trayEnabled: enabled })
}

/**
 * Persist the LAN exposure preference without touching any other stored field.
 * @param userData - Electron userData, the same directory startup reads.
 * @param enabled - Whether the proxy should listen on the local network.
 * @returns After the document holds the choice.
 */
export async function saveShellExposure(userData: string, enabled: boolean): Promise<void> {
  await new DesktopSettingsFile(userData).saveUpdates({ exposedNetwork: enabled })
}
