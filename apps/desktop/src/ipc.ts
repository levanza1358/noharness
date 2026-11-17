import type { DesktopFileActions } from '@noharness/client-ui-file-actions/types'
/** Typed preload operations exposed only by the Electron shell. */

export type { DesktopChannelState, DesktopChannelChangeResult } from '@noharness/client-ui-settings-general/types'
import type {
  DesktopChannelBridge, DesktopChannelState, DesktopNetworkExposureBridge, DesktopShellPreferenceBridge,
} from '@noharness/client-ui-settings-general/types'
import type { DesktopKeyboardApi, DesktopShortcutsApi } from '@noharness/client-shortcuts/protocol'
import type { IpcMainInvokeEvent } from 'electron'
import type { DesktopBrowserBridge } from '@noharness/client-ui-sidebar-browser/types'
import type { DesktopFileDrag } from '@noharness/util-file-drag'

/** IPC channel names kept private to the desktop application bundle. */
export const DESKTOP_IPC = {
  fileSave: 'nhs-desktop:file-save',
  clipboardImageRead: 'nhs-desktop:clipboard-image-read',
  shortcutsInput: 'nhs-desktop:shortcuts-input',
  shortcutsCloseWindow: 'nhs-desktop:shortcuts-close-window',
  shortcutsGet: 'nhs-desktop:shortcuts-get',
  shortcutsEdit: 'nhs-desktop:shortcuts-edit',
  shortcutsChanged: 'nhs-desktop:shortcuts-changed',
  shortcutsRecording: 'nhs-desktop:shortcuts-recording',
  boot: 'nhs-desktop:boot',
  enterWorkspace: 'nhs-desktop:enter-workspace',
  onboardingActive: 'nhs-desktop:onboarding-active',
  onboardingApiKey: 'nhs-desktop:onboarding-api-key',
  bootFailed: 'nhs-desktop:boot-failed',
  browserAcquire: 'nhs-desktop:browser-acquire',
  browserRelease: 'nhs-desktop:browser-release',
  browserOpenRequested: 'nhs-desktop:browser-open-requested',
  directoryPick: 'nhs-desktop:directory-pick',
  fileDragPrepare: 'nhs-desktop:file-drag-prepare',
  fileDragCancel: 'nhs-desktop:file-drag-cancel',
  fileDragStart: 'nhs-desktop:file-drag-start',
  fileDragRelease: 'nhs-desktop:file-drag-release',
  deviceInfo: 'nhs-desktop:device-info',
  shellTrayGet: 'nhs-desktop:shell-tray-get',
  shellTraySet: 'nhs-desktop:shell-tray-set',
  shellTrayChanged: 'nhs-desktop:shell-tray-changed',
  shellNetworkGet: 'nhs-desktop:shell-network-get',
  shellNetworkSet: 'nhs-desktop:shell-network-set',
  shellNetworkChanged: 'nhs-desktop:shell-network-changed',
  localeBootstrap: 'nhs-desktop:locale-bootstrap',
  localeChanged: 'nhs-desktop:locale-changed',
  updatesChannelGet: 'nhs-desktop:updates-channel-get',
  updatesChannelSet: 'nhs-desktop:updates-channel-set',
  updatesChannelChanged: 'nhs-desktop:updates-channel-changed',
  updatesStatus: 'nhs-desktop:updates-status',
  updatesOpen: 'nhs-desktop:updates-open',
  updatesPresentation: 'nhs-desktop:updates-presentation',
  nativeThemeSet: 'nhs-desktop:native-theme-set',
  windowFullscreen: 'nhs-desktop:window-fullscreen',
  windowsAppearance: 'nhs-desktop:windows-appearance',
  windowsMenu: 'nhs-desktop:windows-menu',
} as const

/** Desktop release update state rendered by desktop-owned UI. */
export type DesktopUpdatePreparationFailureKind = 'stop-failed' | 'tasks-changed' | 'tasks-unavailable' | 'fullscreen-timeout'

export interface DesktopUpdateState {
  readonly phase: 'idle' | 'checking' | 'available' | 'downloading' | 'verifying' | 'installing' | 'ready' | 'error'
  readonly version?: string
  readonly message?: string
  /** Main-owned diagnostics without subprocess output or credentials; hidden until expanded. */
  readonly technicalDetails?: string
  readonly percent?: number
  readonly failedOperation?: 'check' | 'download' | 'install' | 'configuration'
  /** Main-owned preparation cause; UI wording is selected by the active locale. */
  readonly preparationFailure?: DesktopUpdatePreparationFailureKind
  /** Current filesystem failure, independent of previous cache cleanup attempts. */
  readonly downloadFailure?: 'space' | 'permission' | 'busy'
}

/** Classified failure copy selected by the Web locale without exposing raw updater diagnostics. */
export type DesktopUpdateFailureKind =
  | 'configuration'
  | 'check'
  | 'check-network'
  | 'download'
  | 'download-network'
  | 'download-space'
  | 'download-permission'
  | 'download-busy'
  | 'install'
  | 'install-network'
  | 'stop-failed'
  | 'tasks-changed'
  | 'tasks-unavailable'
  | 'fullscreen-timeout'

/** Semantic status content; actions open main-process confirmation dialogs only. */
export interface DesktopUpdatePresentation {
  readonly phase: DesktopUpdateState['phase']
  readonly version?: string
  readonly percent?: number
  readonly failure?: DesktopUpdateFailureKind
  readonly configurationError?: DesktopChannelState['error']
}

/** Product documents cannot supply update versions, package URLs, or installation authorization. */
export interface DshDesktopProductApi {
  readonly fileActions: DesktopFileActions
  readonly protocolVersion: 1
  readonly browser: DesktopBrowserBridge
  readonly fileDrag: DesktopFileDrag
  readonly keyboard: DesktopKeyboardApi
  readonly shortcuts: DesktopShortcutsApi
  /**
   * Local machine description for the feedback questionnaire.
   * @returns `name=value` fields separated by `; `, with no hostname, user name, or serial number.
   */
  deviceInfo(): Promise<string>
  readonly updates: {
    readonly channels: DesktopChannelBridge
    status(): Promise<DesktopUpdatePresentation>
    open(): Promise<void>
    subscribe(listener: (state: DesktopUpdatePresentation) => void): () => void
  }
  readonly shell: {
    readonly tray: DesktopShellPreferenceBridge
    readonly network: DesktopNetworkExposureBridge
  }
}

/** Scheme of Desktop-owned application documents. */
export const SCHEME = 'nhs-app'

/**
 * Reject IPC outside the allowed Desktop document origins.
 * @param event - IPC caller whose frame URL supplies the origin.
 * @param hostnames - Desktop document hosts allowed for this operation.
 */
export function assertDesktopSender(event: IpcMainInvokeEvent, hostnames: readonly string[]): void {
  const senderFrame = event.senderFrame
  if (senderFrame === null) throw new Error('nhs desktop: rejected IPC without a sender frame')
  const url = new URL(senderFrame.url)
  if (url.protocol !== `${SCHEME}:` || !hostnames.includes(url.hostname)) {
    throw new Error('nhs desktop: rejected IPC from an unowned renderer')
  }
}
