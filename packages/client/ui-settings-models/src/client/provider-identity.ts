/**
 * What one provider row means to its settings card: the identity the card
 * names, the settings address it writes, and the route facts that only a
 * declared route owns. Shared by the row section and the Models page picker.
 */

import { deriveKeyRef } from './store.ts'
import type { ProviderRow } from './store.ts'
import type { LlmNativeAuth } from '@noharness/api-remotes/client'

/** The visible identity of one provider target. */
export interface ProviderIdentity {
  /** Route id the adapter registered. */
  provider: string
  /** Human name shown beside the route id. */
  displayName: string
}

/** One existing row or dormant directory entry addressed by an editor action. */
export interface EditorTarget extends ProviderIdentity {
  settingsNs: string
  settingsPath: readonly string[]
  /** The page-managed credential reference, when the card may edit the key itself. */
  credentialRef?: string
  declared?: boolean
  defaultBaseURL?: string
  baseURLEnv?: readonly string[]
  nativeAuth?: LlmNativeAuth
}

/**
 * Address one row the way its editor card expects.
 * @param row - one joined provider row.
 * @returns the card's provider identity, settings address, and route-owned facts.
 */
export function targetOf(row: ProviderRow): EditorTarget {
  const managedRef = deriveKeyRef(row.entry.provider)
  const credentialRef = row.apiKeyEnv === managedRef
    && row.credential?.configured === true
    && row.credential.writable
    ? managedRef
    : undefined
  return {
    provider: row.entry.provider,
    displayName: row.entry.displayName,
    settingsNs: row.entry.settingsNs,
    settingsPath: row.entry.settingsPath,
    ...credentialRef === undefined ? {} : { credentialRef },
    // Only declared routes may expose route-owned fields.
    ...row.entry.declared === true ? { declared: true } : {},
    ...row.entry.defaultBaseURL === undefined ? {} : { defaultBaseURL: row.entry.defaultBaseURL },
    ...row.entry.baseURLEnv === undefined ? {} : { baseURLEnv: row.entry.baseURLEnv },
    ...row.entry.nativeAuth === undefined ? {} : { nativeAuth: row.entry.nativeAuth },
  }
}

/**
 * Stable visible and accessible identity for one provider target.
 * @param target - the provider's route id and display name.
 * @returns the route id, or the display name with the id in parentheses.
 */
export function providerTargetLabel(target: ProviderIdentity): string {
  return target.provider === target.displayName
    ? target.provider
    : `${target.displayName} (${target.provider})`
}

/**
 * Derive a route id from a provider name: lowercase, with every run of
 * characters an id cannot carry collapsed into one dash.
 * @param name - the provider name the user typed.
 * @returns the derived id, possibly empty or still rejected by `ROUTE_PATTERN`.
 */
export function routeIdFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Replace the one provider placeholder in localized destructive-action copy.
 * @param template - the localized template naming `{provider}`.
 * @param target - the provider the sentence is about.
 * @returns the copy with the provider's stable label substituted.
 */
export function providerCopy(template: string, target: ProviderIdentity): string {
  return template.replace('{provider}', providerTargetLabel(target))
}
