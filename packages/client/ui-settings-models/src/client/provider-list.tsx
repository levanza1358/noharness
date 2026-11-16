/** The Providers page's list of already-declared providers, one row each. */
import type { ReactNode } from 'react'
import type { ProviderRow } from './store.ts'
import { providerCopy, targetOf } from './provider-identity.ts'
import type { EditorTarget } from './provider-identity.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** What one declared provider row draws and the two actions it offers. */
export interface ProviderListProps {
  readonly rows: readonly ProviderRow[]
  readonly t: (key: keyof typeof en) => string
  readonly onEdit: (target: EditorTarget) => void
  readonly onRemove: (target: EditorTarget) => void
}

/**
 * Render the providers a deployment already declared.
 * @param props - the declared rows, their copy, and the two row actions.
 * @returns the list, empty when nothing is declared.
 */
export function ProviderList(props: ProviderListProps): ReactNode {
  const { rows, t } = props
  if (rows.length === 0) return null
  return (
    <ul className={styles['rows']}>
      {rows.map((row) => {
        const target = targetOf(row)
        return (
          <li key={row.entry.provider} className={styles['rowCard']}>
            <div className={styles['rowHead']}>
              <span className={styles['rowIdentity']}>
                <span className={styles['rowName']}>{row.entry.displayName}</span>
                {row.entry.displayName === row.entry.provider
                  ? null
                  : <span className={styles['rowTag']}>{row.entry.provider}</span>}
                <span
                  className={`${styles['credentialDot']} ${row.credential?.configured === true
                    ? styles['credentialDotConfigured']
                    : styles['credentialDotMissing']}`}
                  role="img"
                  aria-label={t(row.credential?.configured === true ? 'credentialConfigured' : 'credentialMissing')}
                  title={t(row.credential?.configured === true ? 'credentialConfigured' : 'credentialMissing')}
                />
              </span>
              <span className={styles['rowActions']}>
                <button
                  type="button"
                  className={styles['secondaryButton']}
                  aria-label={providerCopy(t('editProvider'), target)}
                  onClick={() => { props.onEdit(target) }}
                >
                  {t('edit')}
                </button>
                {row.removable
                  ? (
                    <button
                      type="button"
                      className={styles['dangerButton']}
                      aria-label={providerCopy(t('removeProvider'), target)}
                      onClick={() => { props.onRemove(target) }}
                    >
                      {t('remove')}
                    </button>
                  )
                  : null}
              </span>
            </div>
            {row.entry.error === undefined ? null : <p className={styles['error']}>{row.entry.error}</p>}
          </li>
        )
      })}
    </ul>
  )
}
