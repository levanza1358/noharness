import type { SettingsPathOpView } from '@noharness/api-remotes/client'
import type { JsonValue } from '@noharness/util-values'
import type { SettingsNamespaceView } from '@noharness/api-remotes/client'
import type { ModelsOperations } from './operations.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import type { en } from './locales.ts'
import type { DeepSeekModelsValidationFailure } from './DeepSeekModelsEditor.tsx'
import type { ReasoningEffortsFailure } from './ModelReasoningEfforts.tsx'
import { isRecord } from './provider-draft.ts'
import { stringAt } from './provider-card.ts'

/** The row checker both families share. */
export type ModelCheck = (
  value: unknown,
) => DeepSeekModelsValidationFailure | ReasoningEffortsFailure | undefined

/** The card state a write reads and updates. */
export interface ApplyInput {
  readonly layout: 'deepseek' | 'pi-ai' | 'unknown'
  readonly namespace: SettingsNamespaceView
  readonly schema: SettingsSchemaOperations
  readonly settingsPath: readonly string[]
  readonly operations: ModelsOperations
  readonly t: (key: keyof typeof en) => string
  readonly draft: Record<string, unknown>
  readonly committedOriginal: unknown
  readonly expectedRevision: number
  /** Whether removing this route's derived reference restores native auth. */
  readonly clearsDerivedRef: boolean
  /** The derived reference the pi-ai profile records when a key is stored. */
  readonly keyRef: string
  /** The typed key with paste whitespace removed. */
  readonly keyValue: string
  /** A staged credential removal that has not run yet. */
  readonly keyRemoval:
    { readonly ref: string; readonly removed?: true } | undefined
  /** The resolved schema node for this card's position. */
  readonly node: Parameters<SettingsSchemaOperations['validate']>[0]
  readonly validateModels: ModelCheck
  readonly setDraft: (
    next: (current: Record<string, unknown>) => Record<string, unknown>,
  ) => void
  readonly setCommittedOriginal: (value: unknown) => void
  readonly setExpectedRevision: (value: number) => void
  readonly setKeyDraft: (
    value: string | { readonly ref: string; readonly removed?: true },
  ) => void
}

/**
 * The write for this card, or a failure message. Every edit travels as path
 * ops against the STORED section: the draft comes from the redacted
 * descriptor, so a wholesale replace rebuilt from it could delete fields
 * outside the card. Ops name only the fields this card can see.
 * @param input - the card's draft, the stored baseline, and its write faces.
 * @returns a failure message, or undefined once everything committed.
 */
export async function applyOnce(
  input: ApplyInput,
): Promise<string | undefined> {
  const {
    namespace,
    schema,
    settingsPath,
    operations,
    t,
    draft,
    keyValue,
    keyRemoval,
  } = input
  // Removing a catalog route's conventional reference restores native auth.
  // Other aliases and custom routes keep their named environment fallback.
  const profileDraft = input.clearsDerivedRef
    ? schema.deletePath(draft, ['apiKeyEnv'])
    : draft
  // A pi-ai profile names the conventional reference only when this page is
  // about to store a key. Otherwise the provider keeps its native auth path.
  const next =
    input.layout === 'pi-ai' &&
    stringAt(schema, profileDraft, 'apiKeyEnv') === undefined &&
    stringAt(
      schema,
      schema.getPath(namespace.base, settingsPath),
      'apiKeyEnv',
    ) === undefined &&
    keyValue.length > 0
      ? schema.setPath(profileDraft, ['apiKeyEnv'], input.keyRef)
      : profileDraft
  // The same checker gates the submit button, so a card cannot reach this
  // with a bad row; it stays because the schema check below would refuse
  // the write with a message naming a path instead of the row, and because
  // nothing but this function decides what is written.
  const failure = input.validateModels(schema.getPath(next, ['models']))
  /* v8 ignore next 3 -- unreachable from the card: the same failure disables submit */
  if (failure !== undefined) {
    return `${t('model')} ${String(failure.index + 1)}: ${t(failure.key)}`
  }
  /* v8 ignore next -- apply is only reachable from the rendered card, which refused an unresolved path */
  if (settingsPath.length === 0) {
    const sectionError = schema.validate(input.node, next)
    if (sectionError !== undefined) return sectionError
  }
  const materializesNativeProfile =
    input.layout === 'pi-ai' &&
    schema.getPath(namespace.value, settingsPath) === undefined &&
    input.committedOriginal === undefined &&
    Object.keys(next).length === 0
  const ops: SettingsPathOpView[] = materializesNativeProfile
    ? [{ op: 'set', path: [...settingsPath], value: {} }]
    : pathOps(settingsPath, input.committedOriginal, next)
  if (keyRemoval !== undefined && keyRemoval.removed !== true) {
    const removed = await operations.removeCredential(keyRemoval.ref)
    if (removed !== undefined) return removed
    // A later settings failure cannot restore a secret that was deleted.
    input.setKeyDraft({ ...keyRemoval, removed: true })
  }
  if (ops.length > 0) {
    const written = await operations.writeSettings(
      namespace.ns,
      ops,
      input.expectedRevision,
    )
    if (written.kind !== 'written')
      return written.kind === 'conflict' ? t('conflict') : written.message
    input.setCommittedOriginal(schema.getPath(written.view.user, settingsPath))
    input.setExpectedRevision(written.view.revision)
    input.setDraft(() => next)
  }
  if (keyValue.length > 0) {
    const stored = await operations.storeCredential(input.keyRef, keyValue)
    if (stored !== undefined) return stored
  }
  input.setKeyDraft('')
  return undefined
}

/**
 * The minimal path ops carrying `after` over `before`, both as the card sees
 * them. Only keys the card observed are named; fields absent from both sides
 * produce no op, which is why edits are path-addressed rather than a rebuilt
 * section. Objects are diffed field by field, so an omitted field keeps the
 * value an unset restores from the inherited layer instead of a whole-object
 * set discarding it.
 * @param base - path of the edited subtree inside the user section.
 * @param before - the subtree as loaded, or undefined when it is new.
 * @param after - the subtree as edited.
 * @returns ordered set/unset ops; empty when nothing changed.
 */
export function pathOps(
  base: readonly string[],
  before: unknown,
  after: Record<string, unknown>,
): SettingsPathOpView[] {
  const previous = isRecord(before) ? before : {}
  const ops: SettingsPathOpView[] = []
  for (const [key, value] of Object.entries(after)) {
    const prior = previous[key]
    if (JSON.stringify(prior) === JSON.stringify(value)) continue
    if (isRecord(value) && (prior === undefined || isRecord(prior)))
      ops.push(...pathOps([...base, key], prior, value))
    else
      ops.push({ op: 'set', path: [...base, key], value: value as JsonValue })
  }
  for (const key of Object.keys(previous)) {
    if (!(key in after)) ops.push({ op: 'unset', path: [...base, key] })
  }
  return ops
}

/**
 * The catalog beneath the user layer: what the composition entry pinned, or
 * else the schema default that `resolve` would supply. The effective value
 * cannot answer this — it still carries the stored override until the unset
 * is applied, so reading it would echo that override straight back the
 * moment reset drops it, leaving the rows unchanged until a reload.
 * @param schema - schema and path operations.
 * @param namespace - the owning namespace view.
 * @param settingsPath - path from the section root to the provider profile.
 * @param root - the rehydrated section schema.
 * @returns the inherited model rows, or undefined when the catalog declares none.
 */
export function inheritedModels(
  schema: SettingsSchemaOperations,
  namespace: SettingsNamespaceView,
  settingsPath: readonly string[],
  root: Parameters<SettingsSchemaOperations['nodeAtPath']>[0],
): unknown {
  const pinned = schema.getPath(namespace.base, [...settingsPath, 'models'])
  return (
    pinned ?? schema.nodeAtPath(root, [...settingsPath, 'models'])?.meta.default
  )
}
