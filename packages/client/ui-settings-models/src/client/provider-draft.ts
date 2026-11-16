import type {
  SettingsNamespaceView,
  SettingsPathOpView,
} from '@noharness/api-remotes/client'
import type { JsonValue } from '@noharness/util-values'
import type { SettingsSchemaOperations } from './schema-operations.ts'

/**
 * A user-section subtree as a plain draft object (absent → empty).
 * @param schema - schema and path operations.
 * @param namespace - the owning namespace view.
 * @param path - path from the section root to the subtree.
 * @returns a detached copy of the stored subtree, or an empty object.
 */
export function draftAt(
  schema: SettingsSchemaOperations,
  namespace: SettingsNamespaceView,
  path: readonly string[],
): Record<string, unknown> {
  const subtree = schema.getPath(namespace.user, path)
  if (typeof subtree !== 'object' || subtree === null || Array.isArray(subtree))
    return {}
  return structuredClone(subtree) as Record<string, unknown>
}

/**
 * @param value - candidate value.
 * @returns whether `value` is a plain object.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
