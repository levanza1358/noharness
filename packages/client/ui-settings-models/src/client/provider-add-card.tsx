/** The Models section's add card: one button opening the adopt/declare modes. */
import type { ReactNode } from 'react'
import { IconPlusOutlineRegular, SegmentedControl } from '@noharness/client-ui-primitives'
import type { SettingsNamespaceView } from '@noharness/api-remotes/client'
import { CustomProviderCard } from './CustomProviderCard.tsx'
import { targetOf } from './provider-identity.ts'
import type { EditorTarget, ProviderIdentity } from './provider-identity.ts'
import { ProviderEditor } from './ProviderEditor.tsx'
import type { AddableRow, CatalogDraft } from './provider-row.tsx'
import { protocolChoices, reasoningLevelChoices } from './store.ts'
import type { ProviderRow } from './store.ts'
import type { ModelsOperations } from './operations.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/**
 * The two ways the add card gains a provider: adopt a directory row the
 * adapter already knows, or declare a route it does not.
 */
export type AddMode = 'catalog' | 'custom'

/** The add card's mounted-panel bookkeeping, which the section keeps across closes. */
export interface AddState {
  readonly mode: AddMode
  /** The modes shown since the add card opened; each keeps its panel mounted. */
  readonly visited: ReadonlySet<AddMode>
  /** Whether each add panel has a write or an interrogation in flight. */
  readonly catalogBusy: boolean
  readonly customBusy: boolean
  /** Base of the add card's tab and panel ids. */
  readonly id: string
  readonly setMode: (next: AddMode) => void
  readonly setVisited: (next: (previous: ReadonlySet<AddMode>) => ReadonlySet<AddMode>) => void
  readonly setCatalogBusy: (busy: boolean) => void
  readonly setCustomBusy: (busy: boolean) => void
}

/** What the add card reads: the directory it offers, the draft, and its writers. */
export interface AddCardProps {
  readonly addOpen: boolean
  readonly add: AddState
  readonly rows: readonly ProviderRow[]
  readonly namespaces: ReadonlyMap<string, SettingsNamespaceView>
  readonly writable: boolean
  readonly ready: boolean
  readonly schema: SettingsSchemaOperations
  readonly operations: ModelsOperations
  readonly t: (key: keyof typeof en) => string
  /** The catalog draft, or undefined while the mode is not offered or has no addable row. */
  readonly draft: CatalogDraft | undefined
  readonly onOpen: (initial: AddMode, target: EditorTarget | undefined) => void
  readonly onPick: (target: EditorTarget) => void
  readonly onCloseDraft: (changed: boolean, target: ProviderIdentity) => void
  readonly onCloseCustom: (changed: boolean) => void
  readonly renderSeat: (row: ProviderRow) => ReactNode
}

/**
 * Render the add card or, while it is closed, the single button that opens it.
 * @param props - the directory, the draft, and the card's writers.
 * @returns the add block.
 */
export function AddCard(props: AddCardProps): ReactNode {
  const { addOpen, add, rows, namespaces, writable, ready, schema, operations, t, draft } = props
  const configurable = rows.filter(row => namespaces.has(row.entry.settingsNs))
  const addable: AddableRow[] = rows.flatMap((row) => {
    const namespace = namespaces.get(row.entry.settingsNs)
    return namespace === undefined || row.configured ? [] : [{ row, namespace }]
  })
  const piAi = namespaces.get('llm-pi-ai')
  // Hand-declared routes live in the pi-ai namespace, which is also the only
  // one whose schema names the protocols one may speak; without it mounted
  // there is nothing to declare and the mode is not offered.
  const protocols = protocolChoices(piAi, schema)
  // Each mode is offered while its namespace is mounted and enabled while it
  // has something to offer; the card shows the chosen mode where both are
  // offered, else the only one there is. A mode's panel is mounted while it is
  // the shown mode or has been shown since the card opened — derived, so a
  // refresh that changes which modes are offered can never leave the card
  // without a panel.
  const catalogOffered = configurable.length > 0
  const catalogEnabled = addable.length > 0
  const customOffered = piAi !== undefined
  const customEnabled = protocols.length > 0
  const bothOffered = catalogOffered && customOffered
  const mode: AddMode = bothOffered ? add.mode : customOffered ? 'custom' : 'catalog'
  const mounted = (candidate: AddMode): boolean => mode === candidate || add.visited.has(candidate)
  const switchLocked = add.catalogBusy || add.customBusy
  // The draft's directory row, for the card extension seat. A refresh can drop
  // the row mid-draft (the route was adopted or withdrawn elsewhere); the
  // draft card stays while the seat simply has no row to dispatch.
  const addRow = draft === undefined
    ? undefined
    : rows.find(row => row.entry.provider === draft.target.provider)
  return (
    <div className={styles['addBlock']}>
      {addOpen
        ? (
          <div className={styles['addCard']}>
            <div className={styles['addModes']}>
              {bothOffered
                ? (
                  <SegmentedControl
                    id={add.id}
                    label={t('addMode')}
                    value={mode}
                    disabled={switchLocked}
                    options={[
                      {
                        value: 'catalog',
                        label: t('addCatalog'),
                        disabled: !catalogEnabled,
                        ...catalogEnabled ? {} : { title: t('addCatalogExhausted') },
                      },
                      {
                        value: 'custom',
                        label: t('addCustom'),
                        disabled: !customEnabled,
                        ...customEnabled ? {} : { title: t('addCustomUnavailable') },
                      },
                    ]}
                    onChange={(next) => {
                      add.setMode(next)
                      add.setVisited(previous => new Set([...previous, next]))
                    }}
                  />
                )
                : (
                  // One mode alone has no switch to name it, so the card
                  // carries the mode as its title instead.
                  <div className={styles['editorHeader']}>
                    <span className={styles['editorTitle']}>{t(mode === 'catalog' ? 'addCatalog' : 'addCustom')}</span>
                  </div>
                )}
              <p className={styles['advancedHint']}>
                {t(mode === 'catalog' ? 'addCatalogHint' : 'addCustomHint')}
              </p>
            </div>
            {mounted('catalog') && draft !== undefined
              ? (
                <div
                  id={`${add.id}-catalog-panel`}
                  {...bothOffered ? { role: 'tabpanel', 'aria-labelledby': `${add.id}-catalog` } : {}}
                  hidden={mode !== 'catalog'}
                  className={styles['addPanel']}
                >
                  <div className={styles['field']}>
                    <span className={styles['fieldLabel']}>{t('provider')}</span>
                    <select
                      className={`${styles['input']} ${styles['selectInput']}`}
                      value={draft.target.provider}
                      aria-label={t('provider')}
                      disabled={add.catalogBusy}
                      onChange={(event) => {
                        const picked = addable.find(candidate => candidate.row.entry.provider === event.target.value)
                        /* v8 ignore next -- the select only lists addable rows */
                        if (picked === undefined) return
                        props.onPick(targetOf(picked.row))
                      }}
                    >
                      {addable.map(({ row }) => (
                        <option key={row.entry.provider} value={row.entry.provider}>{row.entry.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <ProviderEditor
                    key={draft.target.provider}
                    provider={draft.target.provider}
                    displayName={draft.target.displayName}
                    hideTitle
                    namespace={draft.namespace}
                    schema={schema}
                    settingsPath={draft.target.settingsPath}
                    operations={operations}
                    {...draft.target.defaultBaseURL === undefined ? {} : { defaultBaseURL: draft.target.defaultBaseURL }}
                    {...draft.target.baseURLEnv === undefined ? {} : { baseURLEnv: draft.target.baseURLEnv }}
                    {...draft.target.nativeAuth === undefined ? {} : { nativeAuth: draft.target.nativeAuth }}
                    {...addRow?.credentialChecks === undefined ? {} : { credentialChecks: addRow.credentialChecks }}
                    t={t}
                    readOnly={!writable}
                    onClose={(changed) => { props.onCloseDraft(changed, draft.target) }}
                    onBusyChange={add.setCatalogBusy}
                  />
                  {addRow === undefined ? null : props.renderSeat(addRow)}
                </div>
              )
              : null}
            {mounted('custom') && piAi !== undefined
              ? (
                <div
                  id={`${add.id}-custom-panel`}
                  {...bothOffered ? { role: 'tabpanel', 'aria-labelledby': `${add.id}-custom` } : {}}
                  hidden={mode !== 'custom'}
                  className={styles['addPanel']}
                >
                  <CustomProviderCard
                    taken={rows.map(row => row.entry.provider)}
                    protocols={protocols}
                    reasoningLevels={reasoningLevelChoices(piAi, schema)}
                    revision={piAi.revision}
                    operations={operations}
                    t={t}
                    readOnly={!writable}
                    onClose={(changed) => { props.onCloseCustom(changed) }}
                    onBusyChange={add.setCustomBusy}
                  />
                </div>
              )
              : null}
          </div>
        )
        : catalogOffered || customOffered
          ? (
            // One entry for both ways to gain a provider; the card behind it
            // splits them. Full width, so it lines up with the rows above.
            <div className={styles['addActions']}>
              <button
                type="button"
                className={styles['addButton']}
                disabled={!writable || !ready || (!catalogEnabled && !customEnabled)}
                onClick={() => {
                  const first = addable[0]
                  const initial: AddMode = catalogEnabled ? 'catalog' : 'custom'
                  props.onOpen(initial, first === undefined ? undefined : targetOf(first.row))
                }}
              >
                <IconPlusOutlineRegular size={14} />
                {t('add')}
              </button>
            </div>
          )
          : null}
    </div>
  )
}
