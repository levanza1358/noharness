/** Dependency-free IPC names shared with the sandboxed mandatory-update preload. */
export const MANDATORY_IPC = {
  status: 'nhs-desktop:mandatory-status', state: 'nhs-desktop:mandatory-state', action: 'nhs-desktop:mandatory-action',
} as const
