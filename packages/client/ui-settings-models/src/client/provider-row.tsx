/** The provider row and its expansion state, shared by the Models section's list and add card. */
import type { ReactNode } from 'react'
import type { SettingsNamespaceView } from '@noharness/api-remotes/client'
import { providerCopy, targetOf } from './provider-identity.ts'
import type { EditorTarget, ProviderIdentity } from './provider-identity.ts'
import type { ProviderRow } from './store.ts'
import { ProviderEditor } from './ProviderEditor.tsx'
import type { ProviderEditorProps } from './ProviderEditor.tsx'
import type { ModelsOperations } from './operations.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** A dormant directory row the add card can adopt, with its registered namespace. */
export interface AddableRow {
  row: ProviderRow
  namespace: SettingsNamespaceView
}

/** The catalog draft the add card shows: its editor target and the namespace that takes the write. */
export interface CatalogDraft {
  target: EditorTarget
  namespace: SettingsNamespaceView
}

/** Values that vary around the shared provider-editor rendering. */
export interface ProviderEditorRenderProps extends Pick<
  ProviderEditorProps,
  'namespace' | 'schema' | 'operations' | 't' | 'readOnly' | 'onClose' | 'hideModels'
> {
  target: EditorTarget
  row: ProviderRow
}

/**
 * Render an editor for either the setup posture or an expanded provider row.
 * @param input - the row, its editor target, and the card's shared dependencies.
 * @returns the provider editor carrying the row's credential facts.
 */
export function renderProviderEditor({ target, row, ...props }: ProviderEditorRenderProps): ReactNode {
  return (
    <ProviderEditor
      provider={target.provider}
      displayName={target.displayName}
      settingsPath={target.settingsPath}
      {...target.declared === true ? { declared: true } : {}}
      {...target.defaultBaseURL === undefined ? {} : { defaultBaseURL: target.defaultBaseURL }}
      {...target.baseURLEnv === undefined ? {} : { baseURLEnv: target.baseURLEnv }}
      {...target.nativeAuth === undefined ? {} : { nativeAuth: target.nativeAuth }}
      {...row.credential === undefined ? {} : { credential: row.credential }}
      {...row.credentialChecks === undefined ? {} : { credentialChecks: row.credentialChecks }}
      {...props}
    />
  )
}

/**
 * Whether a whole-section provider still needs its first key: an unconfigured
 * credential opens the setup card instead of showing a row. This is the
 * first-run posture alone — a user who can already reach some provider gets an
 * ordinary row with the missing-key dot, since nothing here is blocking them.
 * @param row - the joined provider row.
 * @param anyUsable - whether any joined row can already serve requests.
 * @returns whether to render the setup card.
 */
export function needsSetup(row: ProviderRow, anyUsable: boolean): boolean {
  if (anyUsable || row.entry.provider === 'deepseek-account') return false
  if (row.entry.settingsPath.length > 0) return false
  return row.credential?.configured !== true
}

/**
 * The provider-card seat's credential fact: the reference this page would use
 * for the row — the profile's `apiKeyEnv`, or the page's derived
 * `<ROUTE>_API_KEY` while the profile names none — confirmed configured. The
 * derived half is what keeps the seat consistent with the editor on the
 * add-provider draft, whose dormant row names no reference yet.
 */
export function keyConfiguredOf(row: ProviderRow): boolean {
  return row.apiKeyEnv !== undefined
    ? row.credential?.configured === true
    : row.derivedCredential?.configured === true
}

/** What one provider row draws: its state, the section's writers, and the seat dispatcher. */
export interface ProviderRowCardProps {
  readonly row: ProviderRow
  readonly namespace: SettingsNamespaceView
  readonly writable: boolean
  readonly ready: boolean
  readonly open: boolean
  readonly setup: boolean
  readonly anyUsable: boolean
  readonly schema: SettingsSchemaOperations
  readonly operations: ModelsOperations
  readonly t: (key: keyof typeof en) => string
  readonly onEdit: (target: EditorTarget) => void
  readonly onRemove: (target: EditorTarget) => void
  readonly onCloseSetup: (changed: boolean, target: ProviderIdentity) => void
  readonly onCloseEditor: (changed: boolean, target: ProviderIdentity) => void
  readonly renderSeat: (row: ProviderRow) => ReactNode
}

/**
 * One joined provider row, in either posture: the first-run setup card that
 * stands in for a keyless whole-section provider, or the ordinary row with its
 * credential dot, actions, seat, and open editor.
 * @param props - the row, its state, and the section's writers.
 * @returns the list item.
 */
export function ProviderRowCard(props: ProviderRowCardProps): ReactNode {
  const { row, namespace, writable, ready, open, schema, operations, t } = props
  const target = targetOf(row)
  const error = row.entry.error === undefined
    ? null
    : <p role="alert" className={styles['error']}>{row.entry.error}</p>
  if (props.setup) {
    // First-run posture: the provider exists but has no key — the setup card
    // IS its presence on the page, until the user closes it.
    return (
      <li className={styles['setupCard']}>
        {error}
        {renderProviderEditor({
          target,
          row,
          namespace,
          schema,
          operations,
          t,
          readOnly: !writable,
          onClose: (changed) => { props.onCloseSetup(changed, target) },
        })}
        {props.renderSeat(row)}
      </li>
    )
  }
  const credentialConfigured = row.credential?.configured === true
  const credentialMissing = !credentialConfigured
    && row.apiKeyEnv !== undefined
    && row.credential?.configured === false
  return (
    <li className={styles['rowCard']}>
      <div className={styles['rowHead']}>
        <span className={styles['rowIdentity']}>
          <span className={styles['rowName']}>{row.entry.displayName}</span>
          {/* Only the adapter can tell a hand-declared route from a shipped
              one it also has a stored profile for, so the tag follows its
              answer and stays off when it gives none. */}
          {row.entry.declared === true
            ? <span className={styles['rowTag']}>{t('customTag')}</span>
            : null}
          {/* The store keeps the account row only while the account lists models. */}
          {row.entry.provider === 'deepseek-account'
            ? (
              <span className={styles['accountStatus']}>
                <span className={`${styles['credentialDot']} ${styles['credentialDotConfigured']}`} aria-hidden="true" />
                {t('accountSignedIn')}
              </span>
            )
            : null}
          {credentialConfigured
            ? (
              <span
                className={`${styles['credentialDot']} ${styles['credentialDotConfigured']}`}
                role="img"
                aria-label={t('credentialConfigured')}
                title={t('credentialConfigured')}
              />
            )
            : credentialMissing
              ? (
                <span
                  className={`${styles['credentialDot']} ${styles['credentialDotMissing']}`}
                  role="img"
                  aria-label={t('credentialMissing')}
                  title={t('credentialMissing')}
                />
              )
              : null}
        </span>
        <span className={styles['rowActions']}>
          {/* The account catalog comes from the account listing; its model overrides live in cordis.patch.yml. */}
          {row.entry.provider === 'deepseek-account'
            ? null
            : (
              <button
                type="button"
                className={styles['secondaryButton']}
                aria-label={providerCopy(t('editProvider'), target)}
                disabled={!open && !ready}
                onClick={() => { props.onEdit(target) }}
              >
                {t('edit')}
              </button>
            )}
          {row.removable
            ? (
              <button
                type="button"
                className={styles['dangerButton']}
                aria-label={providerCopy(t('removeProvider'), target)}
                disabled={!writable || !ready}
                onClick={() => { props.onRemove(target) }}
              >
                {t('remove')}
              </button>
            )
            : null}
        </span>
      </div>
      {error}
      {props.renderSeat(row)}
      {open
        ? renderProviderEditor({
          target,
          row,
          namespace,
          schema,
          operations,
          t,
          readOnly: !writable,
          onClose: (changed) => { props.onCloseEditor(changed, target) },
        })
        : null}
    </li>
  )
}
