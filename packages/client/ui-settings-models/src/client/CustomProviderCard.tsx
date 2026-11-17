/**
 * The card that declares a provider pi-ai does not ship — a gateway, a
 * self-hosted server, or a provider newer than the installed catalog.
 *
 * This is a create, not an edit, which is why it is its own form rather than
 * the provider editor with extra fields: the route id is being *chosen* here,
 * and the settings address does not exist until it is. It renders as the
 * custom-API panel of the section's add card; the card's mode switch names it
 * when both modes are offered, and with the custom mode alone the card shows
 * this form directly. One `settings.mutate` sets the whole profile at
 * `providers.<route>`; the key travels separately through `credentials/set`
 * under the reference the profile records, exactly as an existing provider's
 * key does.
 *
 * The card declares a provider and nothing else: its name, endpoint, protocol,
 * and key. Models belong to the Models page, so no model row, listing, or
 * reasoning control appears here — Test connection only answers whether the
 * endpoint accepts the protocol and key this profile will carry.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { JsonValue } from '@noharness/util-values'
import { apiKeyFailure } from './apiKey.ts'
import { ApiKeyInput } from './ApiKeyInput.tsx'
import { EditorFooter } from './EditorFooter.tsx'
import { deriveKeyRef } from './store.ts'
import { routeIdFromName } from './provider-identity.ts'
import { protocolLabel } from './protocol-label.ts'
import { protocolNeedsKey } from './protocol-rules.ts'
import type { ModelsOperations } from './operations.ts'
import type { en, ModelsKey } from './locales.ts'
import styles from './ModelsSection.module.css'

/** The settings namespace a hand-declared provider is written into. */
const NS = 'llm-pi-ai'

/**
 * A route id usable as a settings key AND as the stem of a credential name.
 * The leading letter is the second half of that: `deriveKeyRef` uppercases the
 * id and replaces every non-alphanumeric run with `_`, and a credential
 * reference is a POSIX shell identifier, which cannot start with a digit. A
 * digit-leading id passes every check this card makes and then fails at the
 * credential seam with a raw regular expression the user cannot act on.
 */
export const ROUTE_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

/**
 * Endpoint examples for protocols whose SDK expects a different base than an
 * OpenAI-compatible `/v1`: Anthropic's SDK appends `/v1/messages`, and the
 * Gemini protocol expects the API version in the base URL.
 */
const BASE_URL_PLACEHOLDERS: Readonly<Record<string, ModelsKey>> = {
  'anthropic-messages': 'customAnthropicBaseUrlPlaceholder',
  'google-generative-ai': 'customGeminiBaseUrlPlaceholder',
}

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** Props of {@link CustomProviderCard}. */
export interface CustomProviderCardProps {
  /**
   * Route id and display name chosen in the add-provider dialog before this
   * form opened. The id is always derived from the name; only the name is
   * edited here afterwards.
   */
  initial?: { route: string; displayName: string }
  /** Route ids already declared, so the card refuses to shadow one. */
  taken: readonly string[]
  /** Wire protocols the adapter can serve, in the order it reports them. */
  protocols: readonly string[]
  /**
   * Revision of the `llm-pi-ai` user section this card opened at, sent with
   * the create so a route another tab declared meanwhile is a refusal rather
   * than a silent overwrite of its whole profile.
   */
  revision: number
  /** The Host operations this card writes and interrogates through. */
  operations: ModelsOperations
  /** Section copy. */
  t: (key: keyof typeof en) => string
  /** Disable writes (read-only settings provider). */
  readOnly: boolean
  /** Close the card; `changed` reports whether a provider was created. */
  onClose: (changed: boolean) => void
  /**
   * Called once per change with whether the create or the endpoint
   * interrogation is in flight, so the owner can hold its surface still.
   */
  onBusyChange?: (busy: boolean) => void
}

/**
 * Render the custom-provider creation card.
 * @param props - existing routes, protocol choices, and copy.
 * @returns the creation card.
 */
export function CustomProviderCard(props: CustomProviderCardProps): ReactNode {
  const { taken, protocols, operations, t, onBusyChange } = props
  // The write is checked against the revision on which this draft was opened.
  const [openedAt] = useState(() => props.revision)
  const [routeState, setRouteState] = useState<{ id: string; touched: boolean }>(
    () => ({ id: props.initial?.route ?? routeIdFromName(props.initial?.displayName ?? ''), touched: false }),
  )
  const [displayName, setDisplayName] = useState(props.initial?.displayName ?? '')
  // The id follows the name until someone edits it by hand.
  const route = routeState.id
  const [baseURL, setBaseURL] = useState('')
  const [protocol, setProtocol] = useState(protocols[0] ?? '')
  const [keyDraft, setKeyDraft] = useState('')
  const [busy, setBusy] = useState(false)
  onBusyChange?.(busy)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  /** The endpoint answered, which is what this line reports. */
  const [tested, setTested] = useState(false)
  /**
   * The profile write landed. Only the key write can still be outstanding, so
   * the fields that describe the provider are settled and the retry path is
   * the credential alone.
   */
  const [committed, setCommitted] = useState(false)
  const disabled = props.readOnly || busy
  /** Everything but the key stops being editable once the provider exists. */
  const profileDisabled = disabled || committed

  const routeInvalid = route.length > 0 && !ROUTE_PATTERN.test(route)
  // After the write the id is the provider's, so its own presence in the
  // directory is no longer a collision.
  const routeTaken = taken.includes(route) && !committed
  const normalizedBaseURL = baseURL.trim()
  const baseUrlInvalid = baseURL.length > 0 && !isHttpUrl(normalizedBaseURL)
  // A blank key is a legal choice only where the protocol can authenticate without one.
  const keyMissing = protocolNeedsKey(protocol) && keyDraft.trim().length === 0
  const keyFailure = keyMissing ? 'keyRequired' as const : apiKeyFailure(keyDraft)
  // The typed key with paste whitespace removed. A blank field yields an empty
  // string, which the create path reads as "no key supplied" — a route may
  // legitimately authenticate through the provider's own ambient discovery.
  const keyValue = keyDraft.trim()
  const endpointReady = route.length > 0 && !routeInvalid && !routeTaken
    && normalizedBaseURL.length > 0 && !baseUrlInvalid
  const ready = endpointReady && keyFailure === undefined
  /** A probe needs a complete endpoint; a key the protocol requires counts. */
  const testReady = endpointReady && !keyMissing
  // The blocked gate worth a line under the form, or the note that models are
  // not one. The key and route-id gates own their own lines, so a card blocked
  // only by one of them stays silent here rather than naming a gate that is
  // already satisfied.
  const hint = failure !== undefined
    || keyFailure !== undefined
    || route.length === 0 || routeInvalid || routeTaken || baseUrlInvalid
    ? undefined
    : endpointReady ? t('customNeedsModelsOptional') : t('customNeedsBaseUrl')

  /** Report the endpoint answer beside the button, dropping a stale one when the draft moves. */
  const changed = (): void => { setTested(false) }

  /** Interrogate the endpoint this card would write. */
  const testConnection = async (): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    setTested(false)
    try {
      const answer = await operations.discoverModels(NS, {
        baseURL: normalizedBaseURL,
        api: protocol,
        ...keyValue.length === 0 ? {} : { apiKey: keyValue },
      })
      if (answer.kind === 'refused') {
        setFailure(answer.message)
        return
      }
      // How many models the endpoint lists is the Models page's business; the
      // test reports only whether it answered.
      setTested(true)
    } finally {
      setBusy(false)
    }
  }

  /** Perform the create, returning a failure message or undefined. */
  const createOnce = async (): Promise<string | undefined> => {
    const keyRef = deriveKeyRef(route)
    const storesKey = keyValue.length > 0
    if (!committed) {
      const profile = {
        ...displayName.length === 0 ? {} : { displayName },
        // The profile names the conventional reference only when this card is
        // about to store a key, matching the editor: a route declared with the
        // key left blank keeps its provider-native auth path (a credential
        // chain, ADC) instead of resolving a reference nothing ever sets.
        ...storesKey ? { apiKeyEnv: keyRef } : {},
        api: protocol,
        baseURL: normalizedBaseURL,
      }
      // `taken` is a snapshot too, so the id check alone cannot see a route
      // declared after this card opened; the revision makes that race a
      // `settings-conflict` instead of a write over the other profile.
      const written = await operations.writeSettings(
        NS,
        [{ op: 'set', path: ['providers', route], value: profile as JsonValue }],
        openedAt,
      )
      if (written.kind !== 'written') {
        return written.kind === 'conflict' ? t('conflict') : written.message
      }
      // The provider now exists. A retry after the key write below fails must
      // not re-run this mutate: the revision it holds is the one this write
      // just superseded, so the Host would answer `settings-conflict` and the
      // key could never be stored from this card at all.
      setCommitted(true)
    }
    if (storesKey) {
      const stored = await operations.storeCredential(keyRef, keyValue)
      // The profile landed; saying the key did not is the only honest report,
      // and the retry above now goes straight back to this write.
      if (stored !== undefined) return stored
    }
    return undefined
  }

  const create = async (): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    try {
      const outcome = await createOnce()
      if (outcome !== undefined) {
        setFailure(outcome)
        return
      }
      props.onClose(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles['editor']}>
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('customRoute')}</span>
        <input
          className={styles['input']}
          type="text"
          value={route}
          placeholder="acme-gateway"
          aria-label={t('customRoute')}
          disabled={profileDisabled}
          onChange={(event) => { setRouteState({ id: event.target.value, touched: true }) }}
        />
      </div>
      {/* A rejected id reads as a fault, not as guidance — the same split the
          key field below already makes between its failure and its hint. */}
      {routeInvalid || routeTaken
        ? <p className={styles['error']}>{t(routeInvalid ? 'customRouteInvalid' : 'customRouteTaken')}</p>
        : <p className={styles['advancedHint']}>{t('customRouteHint')}</p>}
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('customDisplayName')}</span>
        <input
          className={styles['input']}
          type="text"
          value={displayName}
          placeholder={route.length === 0 ? t('customDisplayName') : route}
          aria-label={t('customDisplayName')}
          disabled={profileDisabled}
          onChange={(event) => {
            setDisplayName(event.target.value)
            // An untouched id follows the name it is derived from.
            if (!routeState.touched) setRouteState({ id: routeIdFromName(event.target.value), touched: false })
          }}
        />
      </div>
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('baseUrl')}</span>
        <input
          className={styles['input']}
          type="text"
          value={baseURL}
          placeholder={t(BASE_URL_PLACEHOLDERS[protocol] ?? 'customBaseUrlPlaceholder')}
          aria-label={t('baseUrl')}
          aria-invalid={baseUrlInvalid}
          disabled={profileDisabled}
          onChange={(event) => {
            setBaseURL(event.target.value)
            changed()
          }}
        />
      </div>
      {baseUrlInvalid ? <p className={styles['error']}>{t('customBaseUrlInvalid')}</p> : null}
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('customApi')}</span>
        <select
          className={`${styles['input']} ${styles['selectInput']}`}
          value={protocol}
          aria-label={t('customApi')}
          disabled={profileDisabled}
          onChange={(event) => {
            setProtocol(event.target.value)
            changed()
          }}
        >
          {protocols.map(choice => <option key={choice} value={choice}>{protocolLabel(t, choice)}</option>)}
        </select>
      </div>
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('keyInput')}</span>
        <ApiKeyInput
          t={t}
          value={keyDraft}
          placeholder={t('keyPlaceholder')}
          aria-label={t('keyInput')}
          required={protocolNeedsKey(protocol)}
          disabled={disabled}
          onChange={(event) => {
            setKeyDraft(event.target.value)
            changed()
          }}
        />
        {/* A create card has no stored key to keep, so the blank case says
            what a blank field means here instead: this route may authenticate
            through the provider's own ambient discovery or OAuth. A key the
            protocol requires is a requirement still to meet, not a fault. */}
        {keyFailure === undefined
          ? null
          : <p className={styles[keyMissing ? 'advancedHint' : 'error']}>{t(keyFailure === 'keyBlank' ? 'keyBlankNew' : keyFailure)}</p>}
      </div>
      <div className={styles['addActions']}>
        <button
          type="button"
          className={styles['secondaryButton']}
          disabled={disabled || !testReady}
          onClick={() => { void testConnection() }}
        >
          {t('testConnection')}
        </button>
        {tested ? <span className={styles['advancedHint']}>{t('testConnectionOk')}</span> : null}
      </div>
      {failure !== undefined ? <p className={styles['error']}>{failure}</p> : null}
      {/* Only the gates with something to say render; the route-id gate has its
          own field-level hint, so its blocked state would print an empty line. */}
      {hint === undefined ? null : <p className={styles['advancedHint']}>{hint}</p>}
      <EditorFooter
        t={t}
        busy={busy}
        submitDisabled={disabled || !ready}
        submitLabelKey="create"
        submitBusyLabelKey="creating"
        onCancel={() => { props.onClose(committed) }}
        onSubmit={() => { void create() }}
      />
    </div>
  )
}
