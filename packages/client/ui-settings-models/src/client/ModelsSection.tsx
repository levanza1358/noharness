/**
 * Models settings section: the provider rows joined from the configurable
 * directory, settings namespaces, and credential states, with one editor
 * card at a time. Rows retain the account-first order supplied by the store
 * and expose only confirmed API-key state through accessible
 * solid configured or missing dots. A whole-section provider without a
 * configured key renders as its open setup card instead of a row, but only in
 * the first-run posture — no provider on the page can serve requests yet — and
 * only until the user closes that card. The add flow is one card behind one
 * button: a mode switch chooses between adopting a dormant directory provider
 * (the catalog select over the provider editor) and declaring a custom model
 * API (the create form). A panel mounts the first time its mode is shown and
 * stays mounted, hidden, while the card is open and its mode stays offered,
 * so switching modes discards neither draft and an unvisited mode costs
 * nothing; the switch holds still while either panel has a write or an
 * endpoint interrogation in flight, since a switch underneath one would
 * orphan the answer. Each card kind owns its own open state, so closing one
 * never discards a draft in another. Every
 * mutation writes through the wire, while a provider removal first requires
 * confirmation; the page re-renders from pushed invalidations or the
 * post-apply reload.
 */

import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import type { InjectFace, PropsRenderSlots } from '@noharness/client-ui-slots'
// Type-only: pulls this package's SlotMap merge (the two Models child slots).
import {} from './slot-contract.ts'
import { providerCopy, targetOf } from './provider-identity.ts'
import type { EditorTarget, ProviderIdentity } from './provider-identity.ts'
import { providerUsable } from './store.ts'
import type { ModelsSettingsStore, ProviderRow } from './store.ts'
import type { ModelsOperations } from './operations.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import { AddCard } from './provider-add-card.tsx'
import type { AddMode } from './provider-add-card.tsx'
import { DeleteDialog } from './provider-delete-dialog.tsx'
import { keyConfiguredOf, needsSetup, ProviderRowCard } from './provider-row.tsx'
import { removeProviderProfile } from './provider-remove.ts'
import type { CatalogDraft } from './provider-row.tsx'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** Injected dependencies of {@link ModelsSection} (slot `inject`). */
export interface ModelsSectionInjected {
  /** The page store (loaded on mount, refreshed on pushed invalidations). */
  controller: ModelsSettingsStore
  hooks: {
    /** Page snapshot bound by the UI renderer as useSnapshot. */
    snapshot: ModelsSettingsStore['store']
  }
  /** The Host operations the section and its cards invoke. */
  operations: ModelsOperations
  /** Settings schema and immutable path callbacks. */
  schema: SettingsSchemaOperations
  /** Section copy. */
  t: (key: keyof typeof en) => string
}

/** The child slots this section declares and dispatches (see ./slot-contract.ts). */
type ModelsChildSlots = 'settings.models.provider-card' | 'settings.models.footer'

/** The child-slot dispatch function the renderer binds for the section. */
type ModelsRenderSlot = PropsRenderSlots<ModelsChildSlots>['renderSlot']

/**
 * Props delivered by the slot outlet: the inject face spread flat (the
 * renderer erases the share boundary at the render call) plus the child-slot
 * dispatch seat. The seat is required: the renderer binds it at the render
 * call itself — unlike the inject face it is never absent at runtime — and a
 * direct render that forgets it fails to compile instead of mounting nothing.
 */
export type ModelsSectionProps = Partial<InjectFace<ModelsSectionInjected>> & PropsRenderSlots<ModelsChildSlots>

type ModelsSectionFace = InjectFace<ModelsSectionInjected>

export { providerCopy, providerTargetLabel, targetOf } from './provider-identity.ts'
export type { EditorTarget, ProviderIdentity } from './provider-identity.ts'
export { needsSetup } from './provider-row.tsx'
export { removeProviderProfile } from './provider-remove.ts'

/**
 * Render the Models section content column.
 * @param props - slot-delivered injected dependencies.
 * @returns the section, or null while the shell has not injected yet.
 */
export function ModelsSection(props: ModelsSectionProps): ReactNode {
  const { controller, useSnapshot, operations, schema, t, renderSlot } = props
  if (
    controller === undefined || useSnapshot === undefined || operations === undefined
    || schema === undefined || t === undefined
  ) return null
  return <Loaded injected={{ controller, useSnapshot, operations, schema, t }} renderSlot={renderSlot} />
}

function Loaded({ injected, renderSlot }: { injected: ModelsSectionFace; renderSlot: ModelsRenderSlot }): ReactNode {
  const { controller, operations, schema, t } = injected
  const snapshot = injected.useSnapshot(value => value)
  const state = { ...snapshot, rows: snapshot.rows.map(row => row.entry.provider === 'deepseek-account'
    ? { ...row, entry: { ...row.entry, displayName: t('deepSeekAccount') } } : row) }
  /** A new or failed surface waits for a current snapshot; background refreshes preserve its drafts. */
  const [hasReadySnapshot, setHasReadySnapshot] = useState(state.status === 'ready')
  if (state.status === 'ready' && !hasReadySnapshot) setHasReadySnapshot(true)
  if (state.status === 'error' && hasReadySnapshot) setHasReadySnapshot(false)
  const [editing, setEditing] = useState<EditorTarget | undefined>(undefined)
  const [addOpen, setAddOpen] = useState(false)
  const [addMode, setAddMode] = useState<AddMode>('catalog')
  /** The modes shown since the add card opened; each keeps its panel mounted. */
  const [visited, setVisited] = useState<ReadonlySet<AddMode>>(() => new Set())
  /** Whether each add panel has a write or an interrogation in flight. */
  const [catalogBusy, setCatalogBusy] = useState(false)
  const [customBusy, setCustomBusy] = useState(false)
  /** Base of the add card's tab and panel ids. */
  const addId = useId()
  const [deleteTarget, setDeleteTarget] = useState<EditorTarget | undefined>(undefined)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailure, setDeleteFailure] = useState<string | undefined>(undefined)
  const [savedTarget, setSavedTarget] = useState<ProviderIdentity | undefined>(undefined)
  const [dismissedSetup, setDismissedSetup] = useState<ReadonlySet<string>>(() => new Set())

  const announceSaved = (target: ProviderIdentity): void => {
    // Announced only once the refreshed directory is in the snapshot the
    // notice reads its name from: an apply can rename the route, and the
    // target captured when the card opened still carries the old name.
    void controller.load().then(() => { setSavedTarget(target) })
  }

  /**
   * Close the add card whole. The catalog target is forgotten with it, since
   * `editing` doubles as the row editor's target once the card is closed and a
   * refresh could otherwise open the row of a provider the draft never saved.
   * The busy flags reset here because a panel that closes itself on success
   * unmounts before it can report idle.
   */
  const closeAdd = (): void => {
    setEditing(undefined)
    setAddOpen(false)
    setCatalogBusy(false)
    setCustomBusy(false)
  }

  const closeEditor = (changed: boolean, target: ProviderIdentity): void => {
    closeAdd()
    if (changed) announceSaved(target)
  }

  /**
   * Close a setup card, which owns none of the state above: the row-editor
   * and add cards each own one of those, so clearing them here would discard
   * a draft the user opened beside this card. Dismissal is this card's own —
   * the provider falls back to an ordinary row for the rest of the session,
   * and reopens through Edit.
   */
  const closeSetup = (changed: boolean, target: ProviderIdentity): void => {
    setDismissedSetup(previous => new Set([...previous, target.provider]))
    if (changed) announceSaved(target)
  }

  const closeDelete = (): void => {
    if (deleting) return
    setDeleteTarget(undefined)
    setDeleteFailure(undefined)
  }

  const confirmDelete = (): void => {
    /* v8 ignore next -- the action only renders with a target and is disabled while a deletion is pending */
    if (deleteTarget === undefined || deleting) return
    setDeleting(true)
    setDeleteFailure(undefined)
    void removeProviderProfile(operations, controller, deleteTarget)
      .then((failure) => {
        if (failure !== undefined) {
          setDeleteFailure(failure)
          return
        }
        setDeleteTarget(undefined)
      })
      .finally(() => { setDeleting(false) })
  }

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

  // The saved provider as the directory currently names it. The route id is
  // what the apply cannot change, so it is what the notice is keyed by; a row
  // the same apply removed keeps the captured identity, since nothing newer
  // exists to name it with.
  const savedRow = savedTarget === undefined
    ? undefined
    : state.rows.find(row => row.entry.provider === savedTarget.provider)
  const savedIdentity = savedRow === undefined
    ? savedTarget
    : { provider: savedRow.entry.provider, displayName: savedRow.entry.displayName }

  // One fact decides both first-run postures on this page and the onboarding
  // step: whether the user already has a provider to talk to.
  const anyUsable = state.rows.some(providerUsable)
  const configured = state.rows.filter(row => row.configured)
  const configurable = state.rows.filter(row => state.namespaces.has(row.entry.settingsNs))
  const addable = state.rows.flatMap((row) => {
    const namespace = state.namespaces.get(row.entry.settingsNs)
    return namespace === undefined || row.configured ? [] : [row]
  })
  // The catalog draft: the row the user chose, kept through a refresh that
  // adopts or withdraws it elsewhere so a typed key is never discarded, for as
  // long as its namespace can still take the write; else the first row still
  // addable, since the mode can be entered by a refresh as well as by the
  // switch and the button only picks a target when it opens the card.
  const draft = ((): CatalogDraft | undefined => {
    if (!addOpen || configurable.length === 0) return undefined
    const kept = editing === undefined ? undefined : state.namespaces.get(editing.settingsNs)
    if (editing !== undefined && kept !== undefined) return { target: editing, namespace: kept }
    const first = addable[0]
    const namespace = first === undefined ? undefined : state.namespaces.get(first.entry.settingsNs)
    return first === undefined || namespace === undefined
      ? undefined
      : { target: targetOf(first), namespace }
  })()

  // The row whose editor is open: a click on that same row closes it.
  const openProvider = addOpen ? undefined : editing?.provider

  const renderSeat = (row: ProviderRow): ReactNode =>
    renderSlot(
      'settings.models.provider-card',
      { provider: row.entry, configured: row.configured, keyConfigured: keyConfiguredOf(row) },
      { entryKey: row.entry.settingsNs },
    )

  return (
    <div className={styles['section']}>
      <h2 className={styles['title']}>{t('title')}</h2>
      <p className={styles['intro']}>{t('intro')}</p>
      {!state.writable && state.status === 'ready' ? <p className={styles['notice']}>{t('readOnly')}</p> : null}
      {savedIdentity === undefined
        ? null
        : (
          <p className={styles['savedNotice']} role="status" aria-live="polite">
            {providerCopy(t('savedProvider'), savedIdentity)}
          </p>
        )}
      <ul className={styles['rows']}>
        {configured.map((row) => {
          const target = targetOf(row)
          const namespace = state.namespaces.get(target.settingsNs)
          /* v8 ignore next -- the join marks a row configured only when its namespace resolved */
          if (namespace === undefined) return null
          return (
            <ProviderRowCard
              key={row.entry.provider}
              row={row}
              namespace={namespace}
              writable={state.writable}
              ready={state.status === 'ready'}
              open={editing?.provider === row.entry.provider && !addOpen}
              setup={needsSetup(row, anyUsable) && !dismissedSetup.has(row.entry.provider)}
              anyUsable={anyUsable}
              schema={schema}
              operations={operations}
              t={t}
              onEdit={(next) => {
                // Only opening waits for readiness: closing never discards a
                // draft the user may still want once the refresh lands.
                if (openProvider !== next.provider
                  && controller.store.getSnapshot().status !== 'ready') return
                setSavedTarget(undefined)
                // One card at a time: the add card closes with whatever it
                // held, since closing either card would otherwise discard the
                // other's draft.
                setAddOpen(false)
                setEditing(openProvider === next.provider ? undefined : next)
              }}
              onRemove={(next) => {
                if (controller.store.getSnapshot().status !== 'ready') return
                setSavedTarget(undefined)
                setDeleteFailure(undefined)
                setDeleteTarget(next)
              }}
              onCloseSetup={closeSetup}
              onCloseEditor={closeEditor}
              renderSeat={renderSeat}
            />
          )
        })}
      </ul>
      <AddCard
        addOpen={addOpen}
        add={{
          mode: addMode,
          visited,
          catalogBusy,
          customBusy,
          id: addId,
          setMode: setAddMode,
          setVisited,
          setCatalogBusy,
          setCustomBusy,
        }}
        rows={state.rows}
        namespaces={state.namespaces}
        writable={state.writable}
        ready={state.status === 'ready'}
        schema={schema}
        operations={operations}
        t={t}
        draft={draft}
        onOpen={(initial, initialTarget) => {
          if (controller.store.getSnapshot().status !== 'ready') return
          setSavedTarget(undefined)
          setEditing(initialTarget)
          setAddMode(initial)
          setVisited(new Set([initial]))
          setAddOpen(true)
        }}
        onPick={setEditing}
        onCloseDraft={closeEditor}
        onCloseCustom={(changed) => {
          closeAdd()
          if (changed) void controller.load()
        }}
        renderSeat={renderSeat}
      />
      {renderSlot('settings.models.footer', {})}
      <DeleteDialog
        target={deleteTarget}
        deleting={deleting}
        failure={deleteFailure}
        t={t}
        onCancel={closeDelete}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
