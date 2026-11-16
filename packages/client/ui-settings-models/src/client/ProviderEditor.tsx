/**
 * One provider's editor card, hand-written per adapter family: the primary
 * field is a single write-only **API key** input (the page never asks for an
 * environment-variable name — a typed key stores through `credentials/set`
 * under the profile's reference, deriving `<ROUTE>_API_KEY` when the profile
 * has none. The pi-ai profile records that derivation as `apiKeyEnv` only when
 * a key is entered; a blank key materializes a reference-free profile for
 * provider-native authentication);
 * the collapsed Custom settings area carries the per-family extras (`baseURL` and
 * `retryPolicy` for both families, DeepSeek's id/name/context-window model
 * catalog, and the display name and wire protocol of a pi-ai route the
 * adapter does not ship — the two fields the create card asked that route
 * for, editable here for the same reason).
 * Reasoning effort is deliberately absent: it is a per-MODEL capability, and
 * the models under one provider disagree about it, so a provider-scoped
 * control can only be set to a value some of them reject. The composer's
 * model picker offers each model its own levels; `cordis.patch.yml` keeps the
 * profile field for a deployment that knows its route. Everything else stays
 * owned by `cordis.patch.yml`. Profile edits land as minimal `settings.mutate`
 * path ops against the stored section — the card names only the fields it can
 * see instead of rebuilding the whole subtree from a partial descriptor.
 */

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { validateDeepSeekModels } from './DeepSeekModelsEditor.tsx'
import type { DeepSeekModelsValidationFailure } from './DeepSeekModelsEditor.tsx'
import { apiKeyFailure } from './apiKey.ts'
import { EditorFooter } from './EditorFooter.tsx'
import { validateReasoningEfforts } from './ModelReasoningEfforts.tsx'
import type { ReasoningEffortsFailure } from './ModelReasoningEfforts.tsx'
import {
  deriveKeyRef,
  protocolChoices,
  reasoningLevelChoices,
} from './store.ts'
import { protocolReasoningLevels, protocolNeedsKey } from './protocol-rules.ts'
import {
  retryPolicyDefaults,
  retryPolicyFailure,
} from './RetryPolicyEditor.tsx'
import { draftAt, isRecord } from './provider-draft.ts'
import {
  fieldEdit,
  hasCuratedFields,
  layoutOf,
  profileReads,
  probeApiOf,
  refFor,
} from './provider-card.ts'
import type {
  EditorReads,
  KeyDraft,
  ProviderEditorProps,
} from './provider-card.ts'
import { applyOnce } from './provider-apply.ts'
import { CuratedFields } from './provider-curated-fields.tsx'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import type { SettingsNamespaceView } from '@noharness/api-remotes/client'
import styles from './ModelsSection.module.css'

export { pathOps } from './provider-draft.ts'
export type { ProviderEditorProps } from './provider-card.ts'

/**
 * Render one provider's editing card.
 * @param props - the addressed profile plus wire faces and copy.
 * @returns the editor card.
 */
export function ProviderEditor(props: ProviderEditorProps): ReactNode {
  const { schema, namespace, settingsPath, operations, t } = props
  const [draft, setDraft] = useState<Record<string, unknown>>(() =>
    initialDraft(schema, namespace, settingsPath),
  )
  // Undefined is untouched; strings hold new input and a reference stages removal.
  const [keyDraft, setKeyDraft] = useState<KeyDraft>()
  const keyText = typeof keyDraft === 'string' ? keyDraft : ''
  const keyRemoval = typeof keyDraft === 'object' ? keyDraft : undefined
  const [busy, setBusy] = useState(false)
  const [listBusy, setListBusy] = useState(false)
  const { onBusyChange } = props
  useEffect(() => {
    onBusyChange?.(busy || listBusy)
  }, [busy, listBusy, onBusyChange])
  const [failure, setFailure] = useState<string | undefined>(undefined)
  const [customizedOpen, setCustomizedOpen] = useState(false)
  // A settings success advances both retry baselines immediately. Keeping the
  // derived fields in the draft prevents a pushed namespace refresh from
  // turning them into deletions when the following credential write is retried.
  const [committedOriginal, setCommittedOriginal] = useState<unknown>(() =>
    schema.getPath(namespace.user, settingsPath),
  )
  const [expectedRevision, setExpectedRevision] = useState(
    () => namespace.revision,
  )
  const root = useMemo(
    () => schema.rehydrate(namespace.schema),
    [namespace.schema, schema],
  )
  const node = useMemo(
    () => schema.nodeAtPath(root, settingsPath),
    [root, schema, settingsPath],
  )
  const fallback = schema.getPath(namespace.value, settingsPath)
  const disabled = props.readOnly || busy
  const layout = layoutOf(namespace.ns)
  const keyRef = refFor(schema, namespace, settingsPath, props.provider)
  // The same schema read the create card makes, so the choices offered here
  // and there cannot drift apart: both come from the adapter's own `Config`.
  // Only the pi-ai layout has a per-route protocol for the read to find, and
  // it rehydrates the whole section schema, so the other layouts skip it.
  const protocols = useMemo(
    () => (layout === 'pi-ai' ? protocolChoices(namespace, schema) : []),
    [layout, namespace, schema],
  )
  const setField = (key: string, next: string | undefined): void => {
    setDraft(fieldEdit(schema, key, next))
  }
  // What the form currently shows, which is what an interrogation must ask and
  // what decides the protocol's own constraints: an edited-but-unsaved protocol.
  const probeApi = probeApiOf(schema, draft, fallback)
  const schemaReasoningLevels = useMemo(
    () =>
      layout === 'pi-ai' && props.declared === true
        ? reasoningLevelChoices(namespace, schema)
        : [],
    [layout, props.declared, namespace, schema],
  )
  const reasoning = protocolReasoningLevels(probeApi, schemaReasoningLevels)
  const editsReasoning = reasoning.levels.length > 0
  // The model list is validated by the same per-row checker for both families,
  // so a bad row is named by its position rather than by a blanket message.
  const validateModels = (
    value: unknown,
  ): DeepSeekModelsValidationFailure | ReasoningEffortsFailure | undefined =>
    validateDeepSeekModels(value) ??
    (editsReasoning
      ? validateReasoningEfforts(
        value,
        reasoning.levelsOnly ? reasoning.levels : undefined,
      )
      : undefined)
  // Inherited models are checked too where the protocol narrows their levels:
  // switching an inherited route's protocol must not write a route its own models break.
  const modelFailure = validateModels(
    schema.getPath(draft, ['models']) ??
      (reasoning.levelsOnly ? schema.getPath(fallback, ['models']) : undefined),
  )
  const retryNode = useMemo(
    () =>
      layout === 'unknown'
        ? undefined
        : schema.nodeAtPath(root, [...settingsPath, 'retryPolicy']),
    [layout, root, schema, settingsPath],
  )
  const retryDefaults =
    retryNode === undefined
      ? undefined
      : retryPolicyDefaults(
        schema,
        retryNode,
        schema.getPath(namespace.base, [...settingsPath, 'retryPolicy']),
      )
  const retryFailure =
    retryNode === undefined ||
    retryDefaults === undefined ||
    props.credentialOnly === true
      ? undefined
      : retryPolicyFailure(
        schema,
        retryNode,
        schema.getPath(draft, ['retryPolicy']),
        retryDefaults,
        t,
      )
  const keyFailure = apiKeyFailure(keyText)
  // What a probe or a write must carry: the typed key with paste whitespace
  // removed. A blank field yields an empty string, which both call sites read
  // as "no key supplied" rather than as a key — that is how a card whose
  // provider already has a stored key is edited without re-entering it.
  const keyValue = keyText.trim()
  const reads = profileReads({
    schema,
    fallback,
    draft,
    layout,
    derivedRef: deriveKeyRef(props.provider),
    defaultBaseURL: props.defaultBaseURL,
    baseURLEnv: props.baseURLEnv,
    hasNativeAuth: props.nativeAuth !== undefined,
    keyRemoval,
    keyText,
    keyValue,
    probeApi,
    credentialRequired: props.credentialRequired === true,
    t,
    protocolNeedsKey,
  })
  const editorReads: EditorReads = {
    layout,
    keyRef,
    profiles: reads,
    probeApi,
    protocols,
    keyText,
    keyValue,
    derivedRef: deriveKeyRef(props.provider),
    keyDraft: keyDraft ?? undefined,
    keyRemoval,
    disabled,
  }
  const shownKeyFailure = reads.credentialRequiredFailure ?? keyFailure
  // An edited-but-unsaved endpoint, and a key typed but not yet stored.
  const probe = {
    settingsNs: namespace.ns,
    // Naming the route lets an adapter that already describes it answer from
    // its own registry — better metadata, no network call, no endpoint needed.
    provider: props.provider,
    ...(reads.probeBaseURL === undefined
      ? {}
      : { baseURL: reads.probeBaseURL }),
    ...(probeApi === undefined ? {} : { api: probeApi }),
    ...(keyValue.length === 0 ? {} : { apiKey: keyValue }),
  }
  const apply = async (): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    try {
      const failure = await applyOnce({
        credentialOnly: props.credentialOnly === true,
        layout,
        namespace,
        schema,
        settingsPath,
        operations,
        t,
        draft,
        committedOriginal,
        expectedRevision,
        clearsDerivedRef: reads.clearsDerivedRef,
        keyRef,
        keyValue,
        keyRemoval,
        node: node as Parameters<typeof applyOnce>[0]['node'],
        validateModels,
        setDraft,
        setCommittedOriginal,
        setExpectedRevision,
        setKeyDraft,
      })
      if (failure !== undefined) {
        setFailure(failure)
        return
      }
      props.onClose(true)
    } finally {
      setBusy(false)
    }
  }

  if (node === undefined) {
    // A directory entry addressing a position its schema cannot resolve is a
    // host-side inconsistency; showing it beats a blank card.
    return (
      <p className={styles['error']}>
        {props.provider}: {props.t('settingsPathUnresolvable')}
      </p>
    )
  }

  const family = hasCuratedFields(layout) ? layout : undefined
  return (
    <div
      className={
        props.credentialOnly === true ? styles['addBlock'] : styles['editor']
      }
    >
      {props.hideTitle === true ? null : (
        <div className={styles['editorHeader']}>
          <span className={styles['editorTitle']}>{props.displayName}</span>
          {props.provider !== props.displayName ? (
            <span className={styles['editorRoute']}>{props.provider}</span>
          ) : null}
        </div>
      )}
      {family === undefined ? (
        <p
          className={styles['advancedHint']}
        >{`${t('advancedHint')} (${namespace.ns})`}</p>
      ) : (
        <CuratedFields
          family={family}
          layout={layout}
          props={props}
          reads={editorReads}
          draft={draft}
          fallback={fallback}
          root={root}
          ownsIdentity={props.declared === true}
          reasoning={reasoning}
          probe={probe}
          retry={{
            node: retryNode,
            defaults: retryDefaults,
            failure: retryFailure,
            open: customizedOpen,
          }}
          shownKeyFailure={shownKeyFailure}
          setDraft={setDraft}
          setField={setField}
          setKeyDraft={setKeyDraft}
          setFailure={setFailure}
          setListBusy={setListBusy}
          setCustomizedOpen={setCustomizedOpen}
        />
      )}
      {failure !== undefined ? (
        <p className={styles['error']}>{failure}</p>
      ) : null}
      {props.credentialOnly === true || modelFailure === undefined ? null : (
        <p className={styles['advancedHint']}>
          {`${t('model')} ${String(modelFailure.index + 1)}: ${t(modelFailure.key)}`}
        </p>
      )}
      {/* A closed fold hides the fields, so a refused stored policy still explains a disabled Apply. */}
      {retryFailure === undefined || customizedOpen ? null : (
        <p id={`${props.provider}-retry-failure`} className={styles['error']}>
          {retryFailure.message}
        </p>
      )}
      <EditorFooter
        t={t}
        busy={busy}
        submitDisabled={
          disabled ||
          layout === 'unknown' ||
          (props.credentialOnly !== true && modelFailure !== undefined) ||
          retryFailure !== undefined ||
          shownKeyFailure !== undefined ||
          (props.credentialRequired === true && keyValue.length === 0)
        }
        submitLabelKey={props.submitLabelKey ?? 'apply'}
        submitBusyLabelKey={props.submitBusyLabelKey ?? 'applying'}
        cancelLabelKey={
          keyRemoval?.removed === true
            ? 'close'
            : (props.cancelLabelKey ?? 'cancel')
        }
        onCancel={() => {
          props.onClose(false)
        }}
        onSubmit={() => {
          props.onSubmitCredential?.()
          void apply()
        }}
      />
    </div>
  )
}

/**
 * The card's opening draft: the stored subtree, with a stored retry policy
 * naming the mode it inherits.
 * @param schema - schema and path operations.
 * @param namespace - the owning namespace view.
 * @param settingsPath - path from the section root to the provider profile.
 * @returns the draft the fields edit.
 */
function initialDraft(
  schema: SettingsSchemaOperations,
  namespace: SettingsNamespaceView,
  settingsPath: readonly string[],
): Record<string, unknown> {
  const loaded = draftAt(schema, namespace, settingsPath)
  const policy = loaded['retryPolicy']
  // A stored retry policy without a mode edits under the mode it inherits;
  // the draft names it so a saved policy always carries one.
  if (!isRecord(policy) || policy['mode'] !== undefined) return loaded
  const path = [...settingsPath, 'retryPolicy']
  const node = schema.nodeAtPath(schema.rehydrate(namespace.schema), path)
  /* v8 ignore next -- a stored retryPolicy implies the schema declares one */
  if (node === undefined) return loaded
  const { mode } = retryPolicyDefaults(
    schema,
    node,
    schema.getPath(namespace.base, path),
  )
  return { ...loaded, retryPolicy: { ...policy, mode } }
}
