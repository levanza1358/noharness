/** Shared names for the desktop Platform bridge. */
/** Private desktop channels; the Platform renderer receives bootstrap and locale updates. */
export const PLATFORM_IPC = {
  bootstrap: 'nhs-platform:bootstrap',
  localeChanged: 'nhs-platform:locale-changed',
  open: 'nhs-platform:open',
  bounds: 'nhs-platform:bounds',
  close: 'nhs-platform:close',
} as const

/** Resolved Platform language; Desktop resolves the system preference before sending it. */
export type PlatformLocale = 'en_US' | 'zh_CN'
