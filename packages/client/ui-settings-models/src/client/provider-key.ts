import type {
  CredentialInfo,
  LlmNativeAuth,
} from '@noharness/api-remotes/client'
import type { en } from './locales.ts'

/** How this route's key is stored and read back, as the fields render it. */
export interface KeyState {
  /** The reference the adapter reads for this route; undefined for native auth. */
  readonly keyHint: string | undefined
  /** References the hint may name, with oauth references filtered out. */
  readonly visibleRefs: readonly string[]
  /** The reference whose stored credential answered a check. */
  readonly detectedRef: string | undefined
  /** `detectedRef` when it is one of the references a user can read. */
  readonly detectedVisibleRef: string | undefined
  /** The reference the clear action names: the one that answered, or the first the route checks. */
  readonly clearRef: string
  /** The stored credential's masked state and write affordances. */
  readonly detected: readonly [string, CredentialInfo] | undefined
  /** Whether a saved key is stored server-side rather than typed here. */
  readonly savedCredential: boolean
  /** Whether every checked reference reported no credential. */
  readonly missingRefs: boolean
  /** Whether the route authenticates without a key this field could store. */
  readonly keylessNativeAuth: boolean
  /** Hint under the key input; undefined renders none. */
  readonly credentialHint: string | undefined
  /** Placeholder for an empty key input. */
  readonly keyPlaceholder: string
}

/**
 * Read the key field's copy from the route's references and the page's checks.
 * @param input - the profile's named reference, the adapter's report, and the field state.
 * @returns the references, which of them answered a check, and the field's copy.
 */
export function keyState(input: {
  readonly namedRef: string | undefined
  /** The reference this page derives for the route. */
  readonly derivedRef: string
  readonly nativeAuth: LlmNativeAuth | undefined
  readonly endpointEnv: readonly string[]
  readonly credential: CredentialInfo | undefined
  readonly credentialChecks:
    Readonly<Record<string, CredentialInfo>> | undefined
  readonly keyText: string
  readonly keyRemoval: { readonly removed?: true } | undefined
  readonly t: (key: keyof typeof en) => string
}): KeyState {
  // A named reference is the only credential the adapter reads for this
  // route. Without one, a catalog route authenticates the way the directory
  // reports, and a declared route sends no key at all.
  const nativeAuth =
    input.namedRef === undefined ? input.nativeAuth : undefined
  // Display method-neutral references without changing the adapter's lookup.
  const authRefs =
    input.namedRef === undefined
      ? (nativeAuth?.env ?? []).filter(
        ref => !input.endpointEnv.includes(ref),
      )
      : [input.namedRef]
  const visibleRefs = authRefs.filter(
    ref => !ref.toLowerCase().includes('oauth'),
  )
  const keyHint = visibleRefs[0]
  // A masked field needs one reference to name when none answered; the
  // first the route checks stands in for a route that checks none.
  const missingRef = authRefs[0] ?? input.derivedRef
  const checkedRefs = authRefs.map(
    ref =>
      [
        ref,
        input.credentialChecks?.[ref] ??
          (ref === input.namedRef ? input.credential : undefined),
      ] as const,
  )
  const detected = checkedRefs.find(
    (entry): entry is readonly [string, CredentialInfo] =>
      entry[1]?.configured === true,
  )
  const detectedRef = detected?.[0]
  const detectedVisibleRef =
    detectedRef === undefined || !visibleRefs.includes(detectedRef)
      ? undefined
      : detectedRef
  const missingRefs =
    checkedRefs.length > 0 &&
    checkedRefs.every(([, info]) => info?.configured === false)
  const savedCredential =
    detected?.[1]?.source === 'file' && detectedVisibleRef !== undefined
  const removing = input.keyRemoval
  const credentialHint = input.keyText.length > 0
    ? savedCredential
      ? input.t('keyReplacePending')
      : undefined
    : removing !== undefined
      ? removing.removed === true
        ? input.t('keyRemoveApplied')
        : keyHint === undefined
          ? input.t('keyRemovePending')
          : input
            .t('keyRemovePendingEnvironment')
            .replace('{hint}', () => keyHint)
      : keyHint === undefined
        ? undefined
        : savedCredential
          ? input.t('keySaved')
          : input
            .t(
              detectedRef === undefined
                ? missingRefs
                  ? 'keyFallbackMissing'
                  : 'keyFallbackUnchecked'
                : detectedVisibleRef === undefined
                  ? 'keyFallbackDetectedHidden'
                  : 'keyFallbackDetected',
            )
            .replace('{hint}', () => detectedVisibleRef ?? keyHint)
  return {
    keyHint,
    visibleRefs,
    detectedRef,
    clearRef: detectedRef ?? missingRef,
    detectedVisibleRef,
    detected,
    savedCredential,
    missingRefs,
    // A provider with no native key authentication has no key for this field to store.
    keylessNativeAuth: nativeAuth?.env.length === 0 && nativeAuth.oauth,
    credentialHint,
    keyPlaceholder:
      keyHint === undefined
        ? input.t('keyPlaceholder')
        : input.t('keyPlaceholderFallback').replace('{hint}', () => keyHint),
  }
}
