import type { ReactNode } from 'react'
import { DeepSeekModelsEditor, modelDrafts } from './DeepSeekModelsEditor.tsx'
import { ModelListEditor } from './ModelListEditor.tsx'
import {
  RetryPolicyEditor,
  retryPolicyDefaults,
  retryPolicyFailure,
} from './RetryPolicyEditor.tsx'
import { inheritedModels } from './provider-apply.ts'
import { stringAt } from './provider-card.ts'
import type { EditorReads, ProviderEditorProps } from './provider-card.ts'
import { keyState } from './provider-key.ts'
import { KeyField, RouteFields } from './provider-fields.tsx'
import type { ReasoningChoices } from './provider-card.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** The retry policy this card edits, as its failure copy and open state. */
export interface RetryReads {
  readonly node:
    Parameters<SettingsSchemaOperations['nodeAtPath']>[0] | undefined
  readonly defaults: ReturnType<typeof retryPolicyDefaults> | undefined
  readonly failure: ReturnType<typeof retryPolicyFailure> | undefined
  readonly open: boolean
}

/** What the curated field sets read from this card. */
export interface CuratedInput {
  readonly family: 'deepseek' | 'pi-ai'
  readonly props: ProviderEditorProps
  readonly reads: EditorReads
  readonly draft: Record<string, unknown>
  readonly fallback: unknown
  readonly root:
    Parameters<SettingsSchemaOperations['nodeAtPath']>[0] | undefined
  readonly ownsIdentity: boolean
  readonly reasoning: ReasoningChoices
  readonly probe: Record<string, unknown>
  readonly retry: RetryReads
  readonly shownKeyFailure: keyof typeof en | undefined
  readonly setDraft: (
    next: (current: Record<string, unknown>) => Record<string, unknown>,
  ) => void
  readonly setField: (key: string, next: string | undefined) => void
  readonly setKeyDraft: (
    value: string | { readonly ref: string; readonly removed?: true },
  ) => void
  readonly setFailure: (value: string | undefined) => void
  readonly setListBusy: (value: boolean) => void
  readonly setCustomizedOpen: (value: boolean) => void
}

/**
 * The key field and the fields one known adapter family curates.
 * @param input - the family, the card's reads, and its writers.
 * @returns the curated field set.
 */
export function CuratedFields(input: CuratedInput): ReactNode {
  const { props, reads, draft, fallback, root, t } = {
    ...input,
    t: input.props.t,
  }
  const { schema, namespace, settingsPath, operations } = props
  const key = keyState({
    // A removing key aims at the stored layer the removal restores, not the
    // reference the stored override still names.
    namedRef: reads.profiles.clearsDerivedRef
      ? stringAt(
        schema,
        schema.getPath(namespace.base, settingsPath),
        'apiKeyEnv',
      )
      : stringAt(schema, fallback, 'apiKeyEnv'),
    derivedRef: reads.derivedRef,
    nativeAuth: props.nativeAuth,
    endpointEnv: reads.profiles.endpointEnv,
    credential: props.credential,
    credentialChecks: props.credentialChecks,
    keyText: reads.keyText,
    keyRemoval: reads.keyRemoval,
    credentialRequired: props.credentialRequired === true,
    t,
  })
  const modelsOverridden = schema.hasPath(draft, ['models'])
  const models = modelDrafts(
    modelsOverridden
      ? schema.getPath(draft, ['models'])
      : inheritedModels(
        schema,
        namespace,
        settingsPath,
        root as Parameters<typeof inheritedModels>[3],
      ),
  )
  /** What both family editors take: the rows, whose layer owns them, and the two writes. */
  const catalogProps = {
    models,
    overridden: modelsOverridden,
    t,
    disabled: reads.disabled,
    onChange: (next: Record<string, unknown>[]) => {
      input.setDraft(current => schema.setPath(current, ['models'], next))
    },
    onReset: () => {
      input.setDraft(current => schema.deletePath(current, ['models']))
    },
  }
  const baseURLPlaceholder =
    input.family === 'deepseek' ? t('deepSeekBaseUrl') : undefined
  const routeFields = (
    <RouteFields
      schema={schema}
      namespace={namespace}
      settingsPath={settingsPath}
      provider={props.provider}
      draft={draft}
      ownsIdentity={input.ownsIdentity}
      disabled={reads.disabled}
      baseURL={reads.profiles.baseURL ?? undefined}
      endpointEnv={reads.profiles.endpointEnv}
      endpointHint={reads.profiles.endpointHint}
      baseURLPlaceholder={baseURLPlaceholder}
      probeApi={reads.probeApi}
      protocols={reads.protocols}
      t={t}
      onField={input.setField}
    />
  )
  const retryFields =
    input.retry.defaults === undefined ? null : (
      <RetryPolicyEditor
        policy={schema.getPath(draft, ['retryPolicy'])}
        defaults={input.retry.defaults}
        failure={input.retry.failure}
        failureId={`${props.provider}-retry-failure`}
        showFailure={input.retry.open}
        t={t}
        disabled={reads.disabled}
        onChange={(next) => {
          input.setDraft(current =>
            next === undefined
              ? schema.deletePath(current, ['retryPolicy'])
              : schema.setPath(current, ['retryPolicy'], next),
          )
        }}
      />
    )
  // Both families edit the same rows through the same contract; only the
  // extras differ — DeepSeek's inherited capacities, pi-ai's endpoint
  // interrogation.
  const defaultContextWindow = schema.getPath(fallback, [
    'defaultContextWindow',
  ])
  const defaultMaxTokens = schema.getPath(fallback, ['maxTokens'])
  const defaultInput = schema.getPath(fallback, ['defaultInput'])
  const modelFields =
    input.family === 'deepseek' ? (
      <DeepSeekModelsEditor
        {...catalogProps}
        defaultContextWindow={
          typeof defaultContextWindow === 'number'
            ? defaultContextWindow
            : undefined
        }
        defaultMaxTokens={
          typeof defaultMaxTokens === 'number' ? defaultMaxTokens : undefined
        }
      />
    ) : (
      <ModelListEditor
        {...catalogProps}
        catalogProvider={props.declared === true ? undefined : props.provider}
        reasoningLevels={input.reasoning.levels}
        reasoningLevelsOnly={input.reasoning.levelsOnly}
        defaultInput={Array.isArray(defaultInput) ? defaultInput : undefined}
        probe={input.probe as never}
        probeBlocked={
          reads.keyRemoval !== undefined
            ? 'keyRemovePending'
            : input.shownKeyFailure
        }
        operations={operations}
        onBusyChange={input.setListBusy}
      />
    )
  return (
    <>
      <KeyField
        state={key}
        provider={props.provider}
        keyText={reads.keyText}
        keyRemoval={reads.keyRemoval}
        keyDraft={reads.keyDraft}
        disabled={reads.disabled}
        credentialRequired={props.credentialRequired === true}
        protocolNeedsKeyHere={reads.profiles.protocolNeedsKeyHere}
        protocolKeyMissing={reads.profiles.protocolKeyMissing}
        shownKeyFailure={input.shownKeyFailure}
        autoFocus={props.autoFocusCredential === true}
        t={t}
        onChange={(next) => {
          // Clearing a saved key stages its removal instead of a replacement.
          input.setKeyDraft(
            next === '' && key.savedCredential && key.detected !== undefined
              ? key.detected[1].writable
                ? { ref: key.detected[0] }
                : ''
              : next,
          )
          input.setFailure(undefined)
        }}
        onClear={() => {
          input.setKeyDraft({ ref: key.clearRef })
          input.setFailure(undefined)
        }}
      />
      {props.credentialOnly === true ? (
        <div className={styles['customizedBody']}>
          {routeFields}
          {modelFields}
        </div>
      ) : (
        <details
          className={styles['customized']}
          onToggle={(event) => {
            input.setCustomizedOpen(event.currentTarget.open)
          }}
        >
          <summary className={styles['customizedSummary']}>
            {t('customized')}
          </summary>
          <div className={styles['customizedBody']}>
            {routeFields}
            {retryFields}
            {modelFields}
          </div>
        </details>
      )}
    </>
  )
}
