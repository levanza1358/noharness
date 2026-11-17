import type { ReactNode } from 'react'
import type { InputHTMLAttributes } from 'react'
import type { SettingsNamespaceView } from '@noharness/api-remotes/client'
import { Tooltip } from '@noharness/client-ui-primitives'
import { ApiKeyInput } from './ApiKeyInput.tsx'
import { stringAt } from './provider-card.ts'
import type { BaseURLPlaceholder, KeyDraft } from './provider-card.ts'
import type { KeyState } from './provider-key.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import { protocolLabel } from './protocol-label.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** Input attributes and section copy for the current credential draft. */
export interface ApiKeyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'type' | 'className' | 'autoComplete'
> {
  /** Unsaved input; stored credentials are never read into this field. */
  readonly value: string
  /** Server-masked preview and actions; the full stored credential stays on the Host. */
  readonly saved?: {
    readonly masked: string
    readonly clear?: () => void
  }
  /** Section copy, including the same reveal labels as SecretText. */
  readonly t: (key: keyof typeof en) => string
}

/** What the route identity fields read from this card. */
export interface RouteFieldInput {
  readonly schema: SettingsSchemaOperations
  readonly namespace: SettingsNamespaceView
  readonly settingsPath: readonly string[]
  readonly provider: string
  readonly draft: Record<string, unknown>
  readonly ownsIdentity: boolean
  readonly disabled: boolean
  readonly baseURL: string | undefined
  readonly endpointEnv: readonly string[]
  readonly endpointHint: string | undefined
  /** The base URL placeholder the family resolves. */
  readonly baseURLPlaceholder: BaseURLPlaceholder
  readonly probeApi: string | undefined
  readonly protocols: readonly string[]
  readonly t: (key: keyof typeof en) => string
  readonly onField: (key: string, next: string | undefined) => void
}

/**
 * The route's own name, endpoint, and wire protocol: the fields a hand-declared
 * pi-ai route carries and no catalog supplies.
 * @param props - the profile, its draft, and the field writers.
 * @returns the route identity fields.
 */
export function RouteFields(props: RouteFieldInput): ReactNode {
  const { schema, namespace, settingsPath, draft, t, onField } = props
  return (
    <>
      {props.ownsIdentity ? (
        <div className={styles['field']}>
          <span className={styles['fieldLabel']}>{t('customDisplayName')}</span>
          <input
            className={styles['input']}
            type="text"
            value={stringAt(schema, draft, 'displayName') ?? ''}
            // What this route is called the moment the field is cleared, which
            // is the layer beneath the one this field edits: a `cordis.yml` may
            // pin a name for a route the catalog does not ship, and only when
            // nothing does is the answer the route id. Reading the effective
            // value instead would echo the stored override back as the thing
            // clearing restores.
            placeholder={
              stringAt(
                schema,
                schema.getPath(namespace.base, settingsPath),
                'displayName',
              ) ?? props.provider
            }
            aria-label={t('customDisplayName')}
            disabled={props.disabled}
            onChange={(event) => {
              onField('displayName', event.target.value)
            }}
          />
        </div>
      ) : null}
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('baseUrl')}</span>
        <input
          className={styles['input']}
          type="text"
          value={stringAt(schema, draft, 'baseURL') ?? ''}
          placeholder={
            props.baseURLPlaceholder ??
            (props.baseURL === undefined
              ? t(
                props.endpointEnv.length > 0
                  ? 'baseUrlConfigured'
                  : 'baseUrlDefault',
              )
              : t('baseUrlPlaceholder').replace(
                '{url}',
                () => props.baseURL as string,
              ))
          }
          aria-describedby={
            props.endpointHint === undefined
              ? undefined
              : `${props.provider}-endpoint-hint`
          }
          aria-label={t('baseUrl')}
          disabled={props.disabled}
          onChange={(event) => {
            onField(
              'baseURL',
              event.target.value === '' ? undefined : event.target.value,
            )
          }}
        />
        {props.endpointHint === undefined ? null : (
          <span
            id={`${props.provider}-endpoint-hint`}
            className={styles['advancedHint']}
          >
            {props.endpointHint}
          </span>
        )}
      </div>
      {/* The protocol sits beside the endpoint it describes, as it does on the
          create card. */}
      {props.ownsIdentity ? (
        <div className={styles['field']}>
          <span className={styles['fieldLabel']}>{t('customApi')}</span>
          <select
            className={`${styles['input']} ${styles['selectInput']}`}
            value={props.probeApi ?? ''}
            aria-label={t('customApi')}
            disabled={props.disabled}
            onChange={(event) => {
              onField('api', event.target.value)
            }}
          >
            {/* A profile naming no protocol — hand-written into
                cordis.patch.yml with no model to need one — selects nothing
                rather than reading as if it had picked the first choice. The
                option is named because a screen reader announces it either
                way, and an empty one is announced as a choice with no
                identity. */}
            {props.probeApi === undefined ? (
              <option value="">{t('customApiUnset')}</option>
            ) : null}
            {props.protocols.map(choice => (
              <option key={choice} value={choice}>
                {protocolLabel(t, choice)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </>
  )
}

/** What the key field reads from this card. */
export interface KeyFieldInput {
  readonly state: KeyState
  readonly provider: string
  readonly keyText: string
  readonly keyRemoval: { readonly removed?: true } | undefined
  readonly keyDraft: KeyDraft | undefined
  readonly disabled: boolean
  readonly protocolNeedsKeyHere: boolean
  readonly protocolKeyMissing: boolean
  readonly shownKeyFailure: keyof typeof en | undefined
  readonly t: (key: keyof typeof en) => string
  readonly onChange: (next: string) => void
  readonly onClear: () => void
}

/**
 * The single write-only key field, its stored-credential affordances, and the
 * hint naming the reference it replaces.
 * @param props - the resolved key state and the field's writers.
 * @returns the key field, or null when the route stores no key here.
 */
export function KeyField(props: KeyFieldInput): ReactNode {
  const { state, t } = props
  // A key replaced or cleared in this session is only a draft: the field drops
  // the masked saved key once that write is staged, so the input shows the
  // hint for the reference a blank field falls back to.
  const replacing = props.keyText.length > 0 || props.keyRemoval !== undefined
  if (state.keylessNativeAuth) return null
  const authHelp =
    state.visibleRefs.length === 0 ? null : (
      <Tooltip
        label={t('keyHelp').replace('{env}', () =>
          state.visibleRefs.join(' / '),
        )}
        side="right"
        delayMs={0}
        focusDelayMs={0}
        portal
        openOnClick
      >
        <button
          type="button"
          className={styles['helpButton']}
          aria-label={t('authHelp')}
        >
          ?
        </button>
      </Tooltip>
    )
  return (
    <div className={styles['field']}>
      <span className={styles['fieldLabel']}>
        {t('keyInput')}
        {authHelp}
      </span>
      <ApiKeyInput
        t={t}
        value={props.keyText}
        {...(!replacing && state.detected !== undefined && state.savedCredential
          ? {
            saved: {
              masked: state.detected[1].masked ?? '',
              ...(state.detected[1].writable ? { clear: props.onClear } : {}),
            },
          }
          : {})}
        placeholder={state.keyPlaceholder}
        aria-label={t('keyInput')}
        aria-invalid={
          props.shownKeyFailure !== undefined && !props.protocolKeyMissing
        }
        aria-describedby={
          state.credentialHint === undefined
            ? undefined
            : `${props.provider}-credential-hint`
        }
        required={props.protocolNeedsKeyHere}
        disabled={props.disabled || props.keyRemoval?.removed === true}
        onChange={(event) => {
          props.onChange(event.target.value)
        }}
      />
      {state.credentialHint === undefined ? null : (
        <p
          id={`${props.provider}-credential-hint`}
          className={
            styles[
              props.keyRemoval !== undefined || state.missingRefs
                ? 'notice'
                : props.keyText.length > 0 || state.detectedRef === undefined
                  ? 'advancedHint'
                  : 'savedNotice'
            ]
          }
        >
          {state.credentialHint}
        </p>
      )}
      {/* A key the protocol requires is a requirement still to meet, not a fault. */}
      {props.shownKeyFailure === undefined ? null : (
        <p
          className={
            styles[props.protocolKeyMissing ? 'advancedHint' : 'error']
          }
        >
          {t(props.shownKeyFailure)}
        </p>
      )}
    </div>
  )
}
