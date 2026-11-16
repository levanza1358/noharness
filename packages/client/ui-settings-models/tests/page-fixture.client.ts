/** The scripted Host face the Models settings specs mount over, with its namespaces and context helpers. */
import Schema from '@noharness/schemastery'
import { Context } from '@noharness/cordis'
import { RemoteError } from '@noharness/client-test-runtime'
import { vi } from 'vitest'
import { ModelsSettingsStore } from '../src/client/store.ts'
import { createModelsOperations } from '../src/client/operations.ts'
import type { ModelsOperations } from '../src/client/operations.ts'
import type { CredentialInfo, RemoteResult, SettingsNamespaceView } from '@noharness/api-remotes/client'
import type { JsonValue } from '@noharness/util-values'

export const PiAiConfig = Schema.object({
  providers: Schema.dict(Schema.object({
    apiKeyEnv: Schema.string().role('credential-ref'),
    api: Schema.union(['openai-completions', 'openai-responses', 'anthropic-messages']),
    baseURL: Schema.string(),
    reasoning: Schema.union(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']),
    headers: Schema.dict(Schema.string()),
  })),
})

export const DeepSeekConfig = Schema.object({
  apiKeyEnv: Schema.string().role('credential-ref'),
  baseURL: Schema.string().pattern(/^https:\/\//),
  reasoningEffort: Schema.union(['off', 'low', 'high', 'max']),
  defaultContextWindow: Schema.number().step(1).min(1),
  models: Schema.array(Schema.object({
    id: Schema.string().required(),
    name: Schema.string(),
    description: Schema.string(),
    contextWindow: Schema.number().step(1).min(1),
  // The adapter declares its catalog as a schema default rather than a
  // composition entry, which is what the restore-defaults path has to read.
  })).default([
    {
      id: 'deepseek-v4-flash',
      name: 'DeepSeek-V4-Flash',
      description: '',
      contextWindow: 1_000_000,
    },
    {
      id: 'deepseek-v4-pro',
      name: 'DeepSeek-V4-Pro',
      description: '',
      contextWindow: 1_000_000,
    },
  ]),
})

export const DEFAULT_DEEPSEEK_MODELS = [
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek-V4-Flash',
    description: 'Preserved hidden detail',
    contextWindow: 1_000_000,
  },
  { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', contextWindow: 1_000_000 },
]

export function wireNamespaces(): SettingsNamespaceView[] {
  return [
    {
      ns: 'llm-deepseek',
      schema: JSON.parse(JSON.stringify(DeepSeekConfig.toJSON())) as JsonValue,
      value: {
        apiKeyEnv: 'DEEPSEEK_API_KEY',
        baseURL: 'https://base',
        defaultContextWindow: 1_000_000,
        maxTokens: 256_000,
        models: DEFAULT_DEEPSEEK_MODELS,
      },
      base: { defaultContextWindow: 1_000_000, maxTokens: 256_000, models: DEFAULT_DEEPSEEK_MODELS },
      user: { baseURL: 'https://base' },
      autoGenerate: true, applies: 'live',
      secrets: [],
      revision: 0,
    },
    {
      ns: 'llm-plain',
      schema: JSON.parse(JSON.stringify(Schema.object({
        profiles: Schema.dict(Schema.object({ note: Schema.string() })),
      }).toJSON())) as JsonValue,
      value: {},
      autoGenerate: true, applies: 'live',
      secrets: [],
      revision: 0,
    },
    {
      ns: 'llm-pi-ai',
      schema: JSON.parse(JSON.stringify(PiAiConfig.toJSON())) as JsonValue,
      value: { providers: { openai: { apiKeyEnv: 'OPENAI_API_KEY', baseURL: 'https://proxy', headers: { 'X-Team': 'a' } }, zombie: {} } },
      user: { providers: { openai: { apiKeyEnv: 'OPENAI_API_KEY', baseURL: 'https://proxy', headers: { 'X-Team': 'a' } }, zombie: {} } },
      autoGenerate: true, applies: 'live',
      secrets: [],
      revision: 0,
    },
    {
      ns: 'subagent-model-selection',
      schema: JSON.parse(JSON.stringify(Schema.object({ enabled: Schema.boolean().default(false) }).toJSON())) as JsonValue,
      value: { enabled: false },
      autoGenerate: true, applies: 'live',
      secrets: [],
      revision: 4,
    },
    {
      ns: 'llm-deepseek-account',
      schema: JSON.parse(JSON.stringify(DeepSeekConfig.toJSON())) as JsonValue,
      value: {
        baseURL: 'https://base',
        defaultContextWindow: 1_000_000,
        maxTokens: 256_000,
        models: DEFAULT_DEEPSEEK_MODELS,
      },
      base: { defaultContextWindow: 1_000_000, maxTokens: 256_000, models: DEFAULT_DEEPSEEK_MODELS },
      user: {},
      autoGenerate: true, applies: 'live',
      secrets: [],
      revision: 0,
    },
  ]
}

/** Credentials answers over the Remote carrier, which has no envelope. */
export function remoteOk<T>(value: T) {
  return { ok: true as const, value }
}
/** The codes this page's scripted Host answers refuse with. */
type RefusalCode = 'credential/rejected' | 'gateway/internal' | 'settings/conflict' | 'settings/rejected'

/** One refusal per code, each carrying the details its own code declares. */
const REFUSALS: { [Code in RefusalCode]: (message: string) => RemoteError<Code> } = {
  'credential/rejected': message => new RemoteError('credential/rejected', message, { ref: 'DEEPSEEK_API_KEY' }),
  'gateway/internal': message => new RemoteError('gateway/internal', message, {}),
  'settings/conflict': message =>
    new RemoteError('settings/conflict', message, { ns: 'llm-pi-ai', expected: 4, actual: 5 }),
  'settings/rejected': message => new RemoteError('settings/rejected', message, { ns: 'llm-pi-ai' }),
}
export function remoteFail(message: string, code: RefusalCode = 'credential/rejected') {
  return { ok: false as const, error: REFUSALS[code](message) }
}

export function scriptedFace(overrides: {
  update?: ReturnType<typeof vi.fn>
  mutate?: ReturnType<typeof vi.fn>
  set?: ReturnType<typeof vi.fn>
  unset?: ReturnType<typeof vi.fn>
} = {}, answer: {
  providers?: () => ReturnType<PageContext['remote']['llm']['listConfigurableProviders']>
  describeCredentials?: PageContext['remote']['credentials']['describe']
} = {}) {
  const providerNamespace = wireNamespaces().find(view => view.ns === 'llm-pi-ai')!
  const update = overrides.update ?? vi.fn(() => Promise.resolve(remoteOk(providerNamespace)))
  const mutate = overrides.mutate ?? vi.fn(() => Promise.resolve(remoteOk(providerNamespace)))
  const set = overrides.set ?? vi.fn(() => Promise.resolve(remoteOk(undefined)))
  const unset = overrides.unset ?? vi.fn(() => Promise.resolve(remoteOk(undefined)))
  const face = {
    llm: {
      listProviders: vi.fn((): ReturnType<PageContext['remote']['llm']['listProviders']> => Promise.resolve(remoteOk([
        { id: 'deepseek-official', name: 'DeepSeek' },
        { id: 'openai', name: 'openai' },
      ]))),
      listConfigurableProviders: vi.fn(answer.providers ?? (() => Promise.resolve(remoteOk([
        { provider: 'deepseek-official', displayName: 'DeepSeek', settingsNs: 'llm-deepseek', settingsPath: [], active: true },
        {
          provider: 'openai', displayName: 'openai', settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'openai'], active: true,
          defaultBaseURL: 'https://api.openai.com/v1', baseURLEnv: ['FIXTURE_ENDPOINT'], nativeAuth: { env: ['OPENAI_API_KEY'], oauth: false },
        },
        {
          provider: 'anthropic', displayName: 'anthropic', settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'anthropic'], active: false,
          defaultBaseURL: 'https://api.anthropic.com', baseURLEnv: ['FIXTURE_ENDPOINT'],
          nativeAuth: { env: ['ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_OAUTH_TOKEN', 'ANTHROPIC_API_KEY'], oauth: true },
        },
        { provider: 'zombie', displayName: 'zombie', settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'zombie'], active: false },
        { provider: 'broken', displayName: 'broken', settingsNs: 'llm-pi-ai', settingsPath: ['nope', 'x'], active: false },
        { provider: 'plain', displayName: 'plain', settingsNs: 'llm-plain', settingsPath: ['profiles', 'plain'], active: false },
      ].map(({ active: _active, ...entry }) => entry))))),
      discoverModels: vi.fn(() => Promise.resolve(remoteOk([]))),
    },
    settings: {
      describe: vi.fn(() => Promise.resolve(remoteOk({ writable: true, hasDocument: false, namespaces: wireNamespaces() }))),
      update,
      mutate,
    },
    credentials: {
      // Typed as the Remote answer rather than the success branch alone: a
      // case that scripts a refusal replaces this mock.
      describe: vi.fn(answer.describeCredentials ?? ((refs: string[]): Promise<RemoteResult<Record<string, CredentialInfo>>> =>
        Promise.resolve(remoteOk(
          Object.fromEntries(refs.map(ref => [ref, {
            configured: ref === 'OPENAI_API_KEY',
            ...ref === 'OPENAI_API_KEY' ? { source: 'file', masked: '••••••••' } : {},
            writable: true,
          }])),
        )))),
      set,
      unset,
    },
  }
  return { face, update, mutate, set, unset }
}


/** The page plugin context type, derived from the store it feeds. */
type PageContext = ConstructorParameters<typeof ModelsSettingsStore>[0]

/**
 * The page plugin's context, scripted down to the namespaces the page reaches.
 * One context per face, as in production: an editor effect keyed by the context
 * would otherwise re-probe on every render.
 */
const contexts = new WeakMap<object, PageContext>()
export function ctxWith(face: object): PageContext {
  const existing = contexts.get(face)
  if (existing !== undefined) return existing
  const ctx = Object.assign(new Context(), { remote: { ...face,
    session: {
      initializeDefaultModel: async () => ({ ok: true, value: undefined }),
      modelCatalog: async () => ({ ok: true, value: { groups: [
        { id: 'deepseek-account', models: [{ id: 'deepseek-v4-flash' }] },
      ] } }),
    },
  } })
  contexts.set(face, ctx)
  return ctx
}

/**
 * The cards' injected Host operations over the same script, bound once per face
 * as the plugin body binds them: an editor effect keyed by this face would
 * otherwise re-probe on every render.
 */
const operations = new WeakMap<object, ModelsOperations>()
export function operationsWith(face: object): ModelsOperations {
  const existing = operations.get(face)
  if (existing !== undefined) return existing
  const bound = createModelsOperations(ctxWith(face))
  operations.set(face, bound)
  return bound
}
