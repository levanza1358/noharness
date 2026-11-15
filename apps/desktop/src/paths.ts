/** Filesystem ownership for the Electron-managed desktop installation. */

import { join } from 'node:path'
import { resolveDshHome } from '@noharness/home-paths'

/** Stable desktop installation paths under the shared Harness home. */
export interface DesktopPaths {
  readonly profile: string
  readonly lock: string
}

/**
 * Resolve every Electron-owned path without changing the shared data roots.
 * @param nhsHome - Harness home shared with npm-installed nhs.
 * @returns immutable desktop path set.
 */
export function resolveDesktopPaths(nhsHome: string = resolveDshHome()): DesktopPaths {
  return {
    profile: join(nhsHome, 'profiles', 'desktop'),
    lock: join(nhsHome, 'profiles', 'desktop', 'lock'),
  }
}
