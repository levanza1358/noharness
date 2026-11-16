import { useState } from 'react'
import type { ReactNode } from 'react'
import type {
  CredentialInfo,
  LlmNativeAuth,
  SettingsNamespaceView,
} from '@noharness/api-remotes/client'
import { credentialRequirement } from './provider-key.ts'
import { deriveKeyRef } from './store.ts'
import type { ModelsOperations } from './operations.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import type { en } from './locales.ts'

/** Per-adapter-family curated field sets (unknown namespaces get the hint alone). */
export type EditorLayout = 'deepseek' | 'pi-ai' | 'unknown'

/** The editor layout the owning namespace selects. */
export function layoutOf(ns: string): EditorLayout {
  if (ns === 'llm-deepseek') return 'deepseek'
  if (ns === 'llm-pi-ai') return 'pi-ai'
  return 'unknown'
}

/** Whether a card renders its provider settings at all. */
export function hasCuratedFields(
  layout: EditorLayout,
): layout is 'deepseek' | 'pi-ai' {
  return layout !== 'unknown'
}

/** The credential reference this profile resolves keys through. */
export function refFor(
  schema: SettingsSchemaOperations,
  namespace: SettingsNamespaceView,
  path: readonly string[],
  provider: string,
): string {
  const profile = schema.getPath(namespace.value, path)
  const named =
    typeof profile === 'object' && profile !== null
      ? (profile as { apiKeyEnv?: unknown }).apiKeyEnv
      : undefined
  return typeof named === 'string' && named.length > 0
    ? named
    : deriveKeyRef(provider)
}

/**
 * A non-blank string field of `source`, if it holds one.
 * @param schema - schema and path operations, unused for the flat objects the card reads.
 * @param source - a draft or profile object.
 * @param key - field name.
 * @returns the non-blank string at `key`, or undefined.
 */
export function stringAt(
  _schema: SettingsSchemaOperations,
  source: unknown,
  key: string,
): string | undefined {
  const value =
    typeof source === 'object' && source !== null
      ? (source as Record<string, unknown>)[key]
      : undefined
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : undefined
}

/**
 * The draft's staged protocol, which is what an interrogation must ask and what
 * decides the protocol's own constraints.
 * @param schema - schema and path operations.
 * @param draft - the card's draft.
 * @param fallback - the stored profile.
 * @returns the protocol the form currently shows, if any.
 */
export function probeApiOf(
  schema: SettingsSchemaOperations,
  draft: Record<string, unknown>,
  fallback: unknown,
): string | undefined {
  return stringAt(schema, draft, 'api') ?? stringAt(schema, fallback, 'api')
}

/**
 * The write that clears or stores one field of the card's draft.
 * @param schema - schema and path operations.
 * @param key - field name.
 * @param next - the typed value; whitespace alone clears the field.
 * @returns the draft writer the field calls.
 */
export function fieldEdit(
  schema: SettingsSchemaOperations,
  key: string,
  next: string | undefined,
): (current: Record<string, unknown>) => Record<string, unknown> {
  // A value of nothing but whitespace is cleared, not stored: `stringAt`
  // already reports it as absent, so the field would otherwise render empty
  // while the draft still carried the spaces into `cordis.patch.yml`, where
  // both adapters would accept that non-empty string as a real value.
  const value =
    next === undefined || next.trim().length === 0 ? undefined : next
  return current =>
    value === undefined
      ? schema.deletePath(current, [key])
      : schema.setPath(current, [key], value)
}

/** The route's endpoint, its hints, and the key requirements this render must meet. */
export interface ProfileReads {
  /** The profile's own endpoint, or the adapter's report; absent when neither names one. */
  readonly baseURL: string | undefined
  /** Environment variables the adapter uses to build its endpoint. */
  readonly endpointEnv: readonly string[]
  /** The hint under the base URL field. */
  readonly endpointHint: string | undefined
  /** An edited-but-unsaved endpoint, falling back to the stored one. */
  readonly probeBaseURL: string | undefined
  /** Whether removing a key restores this route's native authentication. */
  readonly clearsDerivedRef: boolean
  /** Whether the protocol authenticates with no reference and no typed key. */
  readonly protocolNeedsKeyHere: boolean
  /** Whether that required key is still missing. */
  readonly protocolKeyMissing: boolean
  /** The `credentialRequired` failure, as a copy key. */
  readonly credentialRequiredFailure: 'keyRequired' | undefined
}

/** The base URL field's placeholder text. */
export type BaseURLPlaceholder = string | undefined

/**
 * Read a profile's endpoint and credential requirements for one draft.
 * @param input - the profile's layers, the route's report, and the card's draft.
 * @returns the endpoint copy and the key requirements this render must meet.
 */
export function profileReads(input: {
  readonly schema: SettingsSchemaOperations
  readonly fallback: unknown
  readonly draft: Record<string, unknown>
  readonly layout: EditorLayout
  readonly derivedRef: string
  readonly defaultBaseURL: string | undefined
  readonly baseURLEnv: readonly string[] | undefined
  readonly hasNativeAuth: boolean
  readonly keyRemoval: { readonly ref: string } | undefined
  readonly keyText: string
  readonly keyValue: string
  readonly probeApi: string | undefined
  readonly credentialRequired: boolean
  readonly t: (key: keyof typeof en) => string
  readonly protocolNeedsKey: (api: string | undefined) => boolean
}): ProfileReads {
  const { schema, fallback, draft, layout } = input
  const baseURL = stringAt(schema, fallback, 'baseURL') ?? input.defaultBaseURL
  const endpointEnv = input.baseURLEnv ?? []
  const endpointHint =
    layout === 'deepseek'
      ? input.t('deepSeekEndpointHint')
      : baseURL === undefined && endpointEnv.length > 0
        ? input
          .t('baseUrlEnvironment')
          .replace('{env}', () => endpointEnv.join(', '))
        : undefined
  const clearsDerivedRef =
    input.keyRemoval !== undefined &&
    layout === 'pi-ai' &&
    input.hasNativeAuth &&
    stringAt(schema, draft, 'apiKeyEnv') === input.derivedRef
  // A route whose protocol cannot authenticate without a key needs a key reference or a typed key.
  const protocolNeedsKeyHere =
    layout === 'pi-ai' &&
    input.protocolNeedsKey(input.probeApi) &&
    stringAt(schema, draft, 'apiKeyEnv') === undefined &&
    stringAt(schema, fallback, 'apiKeyEnv') === undefined
  const protocolKeyMissing =
    protocolNeedsKeyHere && input.keyValue.length === 0
  return {
    baseURL,
    endpointEnv,
    endpointHint,
    probeBaseURL:
      stringAt(schema, draft, 'baseURL') ??
      stringAt(schema, fallback, 'baseURL'),
    clearsDerivedRef,
    protocolNeedsKeyHere,
    protocolKeyMissing,
    credentialRequiredFailure: credentialRequirement({
      credentialRequired: input.credentialRequired,
      protocolKeyMissing,
      keyText: input.keyText,
      keyValue: input.keyValue,
    }),
  }
}

/** Props of {@link ProviderEditor}. */
export interface ProviderEditorProps {
  /** Provider route id. */
  provider: string
  /** Display name for the card title. */
  displayName: string
  /** Hide the title row (the add card renders its own provider select). */
  hideTitle?: boolean
  /**
   * Whether the adapter reports this route as hand-declared — absent from its
   * installed catalog. Such a route carries its own wire protocol, chosen when
   * it was created and editable here for the same reason; a catalog route's
   * models each carry theirs, so a route-level protocol there could only
   * override every one of them and the card does not offer it.
   */
  declared?: boolean
  /** The owning namespace view (schema, layers, secrets). */
  namespace: SettingsNamespaceView
  /** Settings-owned synchronous schema and immutable path operations. */
  schema: SettingsSchemaOperations
  /** Path from the section root to this provider's profile. */
  settingsPath: readonly string[]
  /** The Host operations this card writes and interrogates through. */
  operations: ModelsOperations
  /** Endpoint the route uses when its profile sets no `baseURL`; absent when the adapter reports none. */
  defaultBaseURL?: string | undefined
  /** Environment variables used by the provider to construct its endpoint. */
  baseURLEnv?: readonly string[]
  /** Authentication the route performs when its profile names no credential reference; absent when the adapter reports none. */
  nativeAuth?: LlmNativeAuth
  /** Redacted state of the profile's named credential reference, from the page snapshot. */
  credential?: CredentialInfo
  /** Redacted checks for the profile's named reference or the provider's native variables. */
  credentialChecks?: Readonly<Record<string, CredentialInfo>>
  /** Section copy. */
  t: (key: keyof typeof en) => string
  /** Disable writes (read-only settings provider). */
  readOnly: boolean
  /** Render only the credential field and actions, without provider settings. */
  credentialOnly?: boolean
  /** Require a newly entered credential before this editor can submit. */
  credentialRequired?: boolean
  /** Give the credential field initial focus when this editor mounts. */
  autoFocusCredential?: boolean
  /** Override the dismiss action copy. */
  cancelLabelKey?: keyof typeof en
  /** Override the idle commit action copy. */
  submitLabelKey?: keyof typeof en
  /** Override the in-flight commit action copy. */
  submitBusyLabelKey?: keyof typeof en
  /** Close the editor; `changed` reports whether an Apply committed. */
  onClose: (changed: boolean) => void
  /** Called on a credential form submission before the save starts. */
  onSubmitCredential?: () => void
  /**
   * Called once per change with whether the apply or the model list's
   * endpoint interrogation is in flight, so the owner can hold its surface
   * still.
   */
  onBusyChange?: (busy: boolean) => void
}

/** A staged key write: text for a new key, a reference for a removal. */
export type KeyDraft =
  string | { readonly ref: string; readonly removed?: true }

/** The card's per-render values, as its fields read them. */
export interface EditorReads {
  readonly layout: EditorLayout
  readonly keyRef: string
  readonly profiles: ProfileReads
  /** The protocol the form currently shows, which an interrogation must ask. */
  readonly probeApi: string | undefined
  readonly protocols: readonly string[]
  readonly keyText: string
  readonly keyValue: string
  /** The reference a typed key stores under, which a removal of a saved key falls back to. */
  readonly derivedRef: string
  readonly keyDraft: KeyDraft | undefined
  readonly keyRemoval:
    { readonly ref: string; readonly removed?: true } | undefined
  readonly disabled: boolean
}

/** The reasoning levels a model list may declare. */
export interface ReasoningChoices {
  readonly levels: readonly string[]
  readonly levelsOnly: boolean
}

/** The reveal state of the key control. */
export type KeyReveal = ReturnType<typeof useState<string>>

/** Anything a card renders. */
export type CardContent = ReactNode
