/**
 * The Models settings section: pick a provider from the configured rows and
 * manage the models it serves. Provider identity, endpoint, protocol, and key
 * live on the Providers page; this page owns the model list of the chosen
 * provider through the same editor card the page used to show per row.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { InjectFace, PropsRenderSlots } from '@noharness/client-ui-slots'
import type { ModelsSectionInjected } from './ModelsSection.tsx'
import { providerCopy, targetOf } from './provider-identity.ts'
import type { ProviderIdentity } from './provider-identity.ts'
import { ProviderEditor } from './ProviderEditor.tsx'
import styles from './ModelsSection.module.css'

/** The child slots this page declares and dispatches (see ./slot-contract.ts). */
type ModelsPageChildSlots = 'settings.models.provider-card' | 'settings.models.footer'

/** The child-slot dispatch function the renderer binds for the section. */
type ModelsPageRenderSlot = PropsRenderSlots<ModelsPageChildSlots>['renderSlot']

/** Props delivered by the slot outlet: the shared inject face plus the child-slot dispatch seat. */
export type ModelsPageProps = Partial<InjectFace<ModelsSectionInjected>> & PropsRenderSlots<ModelsPageChildSlots>

/**
 * Render the Models section content column.
 * @param props - slot-delivered injected dependencies.
 * @returns the provider picker and the chosen provider's model list, or null while the shell has not injected yet.
 */
export function ModelsPage(props: ModelsPageProps): ReactNode {
  const { controller, useSnapshot, operations, schema, t } = props
  if (
    controller === undefined || useSnapshot === undefined || operations === undefined
    || schema === undefined || t === undefined
  ) return null
  return (
    <Loaded
      injected={{ controller, useSnapshot, operations, schema, t }}
      renderSlot={props.renderSlot}
    />
  )
}

function Loaded(
  { injected, renderSlot }: { injected: InjectFace<ModelsSectionInjected>; renderSlot: ModelsPageRenderSlot },
): ReactNode {
  const { controller, operations, schema, t, useSnapshot } = injected
  const state = useSnapshot(value => value)
  /** A new or failed surface waits for a current snapshot; background refreshes preserve its drafts. */
  const [hasReadySnapshot, setHasReadySnapshot] = useState(state.status === 'ready')
  if (state.status === 'ready' && !hasReadySnapshot) setHasReadySnapshot(true)
  if (state.status === 'error' && hasReadySnapshot) setHasReadySnapshot(false)
  const [picked, setPicked] = useState<string | undefined>(undefined)
  const [saved, setSaved] = useState<ProviderIdentity | undefined>(undefined)
  if (state.status === 'idle') void controller.load()
  if (state.status === 'error') {
    /* v8 ignore next -- an error status always carries text; the fallback satisfies the nullable type */
    const errorText = state.error ?? ''
    return (
      <div className={styles['section']}>
        <p className={styles['error']}>{`${t('loadFailed')}: ${errorText}`}</p>
        <button type="button" className={styles['secondaryButton']} onClick={() => { void controller.load() }}>
          {t('retry')}
        </button>
      </div>
    )
  }
  if (!hasReadySnapshot && state.status !== 'ready') {
    return (
      <div className={styles['section']}>
        <h2 className={styles['title']}>{t('title')}</h2>
        <p className={styles['intro']}>{t('intro')}</p>
      </div>
    )
  }
  const rows = state.rows.map(row => row.entry.provider === 'deepseek-account'
    ? { ...row, entry: { ...row.entry, displayName: t('deepSeekAccount') } } : row)
  const configured = rows.filter(row => row.configured)
  // The picked provider keeps its selection across refreshes; an untouched
  // selection follows the first configured row, so the page opens on content.
  const row = configured.find(candidate => candidate.entry.provider === picked) ?? configured[0]
  const namespace = row === undefined ? undefined : state.namespaces.get(row.entry.settingsNs)
  const target = row === undefined ? undefined : targetOf(row)
  return (
    <div className={styles['section']}>
      <h2 className={styles['title']}>{t('title')}</h2>
      <p className={styles['intro']}>{t('intro')}</p>
      {saved === undefined
        ? null
        : (
          <p className={styles['savedNotice']} role="status" aria-live="polite">
            {providerCopy(t('savedProvider'), saved)}
          </p>
        )}
      {row === undefined
        ? <p className={styles['advancedHint']}>{t('noModelsProvider')}</p>
        : (
          <div className={styles['field']}>
            <span className={styles['fieldLabel']}>{t('providerSelect')}</span>
            <select
              className={`${styles['input']} ${styles['selectInput']}`}
              value={row.entry.provider}
              aria-label={t('providerSelect')}
              onChange={(event) => {
                setSaved(undefined)
                setPicked(event.target.value)
              }}
            >
              {configured.map(({ entry }) => (
                <option key={entry.provider} value={entry.provider}>{entry.displayName}</option>
              ))}
            </select>
          </div>
        )}
      {row === undefined || target === undefined || namespace === undefined
        ? null
        : (
          <div className={styles['rowCard']}>
            <ProviderEditor
              key={`${row.entry.settingsNs}:${row.entry.provider}`}
              provider={target.provider}
              displayName={target.displayName}
              settingsPath={target.settingsPath}
              {...target.declared === true ? { declared: true } : {}}
              {...target.defaultBaseURL === undefined ? {} : { defaultBaseURL: target.defaultBaseURL }}
              {...target.baseURLEnv === undefined ? {} : { baseURLEnv: target.baseURLEnv }}
              {...target.nativeAuth === undefined ? {} : { nativeAuth: target.nativeAuth }}
              {...row.credential === undefined ? {} : { credential: row.credential }}
              {...row.credentialChecks === undefined ? {} : { credentialChecks: row.credentialChecks }}
              namespace={namespace}
              schema={schema}
              operations={operations}
              t={t}
              readOnly={!state.writable}
              onClose={(changed) => {
                if (!changed) return
                void controller.load().then(() => { setSaved(target) })
              }}
            />
            {renderSlot(
              'settings.models.provider-card',
              {
                provider: row.entry,
                configured: row.configured,
                keyConfigured: row.apiKeyEnv !== undefined
                  ? row.credential?.configured === true
                  : row.derivedCredential?.configured === true,
              },
              { entryKey: row.entry.settingsNs },
            )}
          </div>
        )}
      {renderSlot('settings.models.footer', {})}
    </div>
  )
}
