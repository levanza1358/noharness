/**
 * The Providers settings section: every provider this deployment declared,
 * with the one `Add custom provider` button that declares another. Naming the
 * provider comes first — a small dialog asks for its route id and display name
 * — and the settings form beside it takes the endpoint, protocol, and key.
 * Models are not part of declaring a provider; they are managed on the Models
 * page once the route exists.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { IconPlusOutlineRegular, Modal } from '@noharness/client-ui-primitives'
import type { InjectFace } from '@noharness/client-ui-slots'
import { CustomProviderCard, ROUTE_PATTERN } from './CustomProviderCard.tsx'
import type { EditorTarget } from './provider-identity.ts'
import { TargetEditor } from './provider-target-editor.tsx'
import { ProviderList } from './provider-list.tsx'
import { DeleteDialog } from './provider-delete-dialog.tsx'
import { removeProviderProfile } from './provider-remove.ts'
import { protocolChoices } from './store.ts'
import type { ModelsSectionInjected } from './ModelsSection.tsx'
import styles from './ModelsSection.module.css'

/** The settings namespace a hand-declared route is written into. */
const NS = 'llm-pi-ai'

/** Props delivered by the slot outlet: the shared inject face. */
export type ProvidersSectionProps = Partial<InjectFace<ModelsSectionInjected>>

/**
 * Render the Providers section content column.
 * @param props - slot-delivered injected dependencies.
 * @returns the provider list and add flow, or null while the shell has not injected yet.
 */
export function ProvidersSection(props: ProvidersSectionProps): ReactNode {
  const { controller, useSnapshot, operations, schema, t } = props
  if (
    controller === undefined || useSnapshot === undefined || operations === undefined
    || schema === undefined || t === undefined
  ) return null
  return (
    <Loaded
      injected={{ controller, useSnapshot, operations, schema, t }}
    />
  )
}

function Loaded(
  { injected }: { injected: InjectFace<ModelsSectionInjected> },
): ReactNode {
  const { controller, operations, schema, t, useSnapshot } = injected
  const state = useSnapshot(value => value)
  const [naming, setNaming] = useState(false)
  const [route, setRoute] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [draft, setDraft] = useState<{ route: string; displayName: string } | undefined>(undefined)
  const [editing, setEditing] = useState<EditorTarget | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<EditorTarget | undefined>(undefined)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailure, setDeleteFailure] = useState<string | undefined>(undefined)
  if (state.status === 'idle') void controller.load()
  const namespace = state.namespaces.get(NS)
  const providers = state.rows.filter(row => row.entry.settingsNs === NS)
  const routeInvalid = route.length > 0 && !ROUTE_PATTERN.test(route)
  const routeTaken = state.rows.some(row => row.entry.provider === route)
  const ready = route.length > 0 && !routeInvalid && !routeTaken && namespace !== undefined
  const disabled = !state.writable || state.status !== 'ready' || namespace === undefined
  const editingNamespace = editing === undefined ? undefined : state.namespaces.get(editing.settingsNs)
  // The row behind the open editor, so the card reads its credential facts.
  const editingRow = editing === undefined
    ? undefined
    : state.rows.find(row => row.entry.provider === editing.provider)
  const reload = (changed: boolean): void => {
    if (changed) void controller.load()
  }
  const closeDelete = (): void => {
    /* v8 ignore next -- the cancel control is disabled while a deletion is pending */
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
  return (
    <div className={styles['section']}>
      <h2 className={styles['title']}>{t('providersTitle')}</h2>
      <p className={styles['intro']}>{t('providersIntro')}</p>
      {state.writable ? null : <p className={styles['notice']}>{t('readOnly')}</p>}
      <ProviderList
        rows={providers}
        t={t}
        onEdit={(target) => { setEditing(target) }}
        onRemove={(target) => {
          setDeleteFailure(undefined)
          setDeleteTarget(target)
        }}
      />
      {editing !== undefined && editingNamespace !== undefined && editingRow !== undefined
        ? (
          <TargetEditor
            key={`${editing.provider}:${editingNamespace.revision}`}
            target={editing}
            row={editingRow}
            namespace={editingNamespace}
            schema={schema}
            operations={operations}
            t={t}
            readOnly={!state.writable}
            onClose={(changed) => {
              setEditing(undefined)
              reload(changed)
            }}
          />
        )
        : null}
      {draft !== undefined && namespace !== undefined
        ? (
          <div className={styles['addCard']}>
            <CustomProviderCard
              key={`${namespace.revision}:${draft.route}`}
              initial={draft}
              taken={state.rows.map(row => row.entry.provider)}
              protocols={protocolChoices(namespace, schema)}
              revision={namespace.revision}
              operations={operations}
              t={t}
              readOnly={!state.writable}
              onClose={(changed) => {
                setDraft(undefined)
                reload(changed)
              }}
            />
          </div>
        )
        : (
          <div className={styles['addActions']}>
            <button
              type="button"
              className={styles['addButton']}
              disabled={disabled}
              onClick={() => {
                setEditing(undefined)
                setRoute('')
                setDisplayName('')
                setNaming(true)
              }}
            >
              <IconPlusOutlineRegular size={14} />
              {t('add')}
            </button>
          </div>
        )}
      <Modal
        open={naming}
        onClose={() => { setNaming(false) }}
        title={t('nameTitle')}
        closeLabel={t('close')}
        description={t('nameDescription')}
        className={styles['deleteDialog'] as string}
        footer={(
          <>
            <button
              type="button"
              className={styles['secondaryButton']}
              data-modal-autofocus
              onClick={() => { setNaming(false) }}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className={styles['primaryButton']}
              disabled={!ready}
              onClick={() => {
                setDraft({ route, displayName: displayName.length === 0 ? route : displayName })
                setNaming(false)
              }}
            >
              {t('nameContinue')}
            </button>
          </>
        )}
      >
        <div className={styles['field']}>
          <span className={styles['fieldLabel']}>{t('nameLabel')}</span>
          <input
            className={styles['input']}
            type="text"
            value={displayName}
            placeholder={route.length === 0 ? t('namePlaceholder') : route}
            aria-label={t('nameLabel')}
            onChange={(event) => { setDisplayName(event.target.value) }}
          />
        </div>
        <div className={styles['field']}>
          <span className={styles['fieldLabel']}>{t('customRoute')}</span>
          <input
            className={styles['input']}
            type="text"
            value={route}
            placeholder="acme-gateway"
            aria-label={t('customRoute')}
            aria-invalid={routeInvalid || routeTaken}
            onChange={(event) => { setRoute(event.target.value) }}
          />
        </div>
        {routeInvalid || routeTaken
          ? <p className={styles['error']}>{t(routeInvalid ? 'customRouteInvalid' : 'customRouteTaken')}</p>
          : <p className={styles['advancedHint']}>{t('customRouteHint')}</p>}
      </Modal>
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
