// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LlmNativeAuth } from '@noharness/api-remotes/client'
import { keyState } from '../src/client/provider-key.ts'
import {
  fieldEdit,
  profileReads,
  probeApiOf,
} from '../src/client/provider-card.ts'
import { protocolNeedsKey } from '../src/client/protocol-rules.ts'
import { protocolChoices } from '../src/client/store.ts'
import { ProviderEditor } from '../src/client/ProviderEditor.tsx'
import type { ProviderEditorProps } from '../src/client/ProviderEditor.tsx'
import { en } from '../src/client/locales.ts'
import {
  operationsWith,
  scriptedFace,
  wireNamespaces,
} from './page-fixture.client.ts'
import { settingsSchema } from './settings-schema.client.ts'

afterEach(cleanup)

const t = (key: keyof typeof en): string => en[key]

/** The stored key names the reference the card checks. */
const savedProfile = {
  apiKeyEnv: 'OPENAI_API_KEY',
  baseURL: 'https://example.test/v1',
  api: 'openai-responses',
}

/** A pi-ai namespace whose `saved` route stores one named reference. */
function namespaceWithProfile(): ReturnType<typeof wireNamespaces>[number] {
  const namespace = wireNamespaces().find(view => view.ns === 'llm-pi-ai')!
  const providers = { saved: savedProfile }
  return {
    ...namespace,
    value: { providers },
    user: { providers },
    base: { providers: { saved: savedProfile } },
  }
}

describe('key state', () => {
  it('reports the applied removal and a key-holding route without native auth', () => {
    const state = keyState({
      namedRef: undefined,
      derivedRef: 'TEST_API_KEY',
      nativeAuth: undefined,
      endpointEnv: [],
      credential: undefined,
      credentialChecks: undefined,
      keyText: '',
      keyRemoval: { removed: true },
      credentialRequired: false,
      t,
    })
    expect(state.credentialHint).toBe(en.keyRemoveApplied)
    expect(state.keylessNativeAuth).toBe(false)
  })

  it('treats a route whose native variables store no key as keyless', () => {
    const nativeAuth: LlmNativeAuth = { env: [], oauth: true }
    const state = keyState({
      namedRef: undefined,
      derivedRef: 'TEST_API_KEY',
      nativeAuth,
      endpointEnv: [],
      credential: undefined,
      credentialChecks: undefined,
      keyText: '',
      keyRemoval: undefined,
      credentialRequired: false,
      t,
    })
    expect(state.keylessNativeAuth).toBe(true)
  })
})

describe('profile reads', () => {
  it('names the adapter environment in the pi-ai endpoint hint', () => {
    const reads = profileReads({
      schema: settingsSchema,
      fallback: {},
      draft: {},
      layout: 'pi-ai',
      derivedRef: 'SAVED_API_KEY',
      defaultBaseURL: undefined,
      baseURLEnv: ['PI_BASE_URL'],
      hasNativeAuth: false,
      keyRemoval: undefined,
      keyText: '',
      keyValue: '',
      probeApi: undefined,
      credentialRequired: false,
      t,
      protocolNeedsKey,
    })
    expect(reads.endpointHint).toBe(
      en.baseUrlEnvironment.replace('{env}', 'PI_BASE_URL'),
    )
    expect(reads.credentialRequiredFailure).toBeUndefined()
  })

  it('clears the derived reference before a removal restores native auth', () => {
    const reads = profileReads({
      schema: settingsSchema,
      fallback: savedProfile,
      draft: { apiKeyEnv: 'SAVED_API_KEY' },
      layout: 'pi-ai',
      derivedRef: 'SAVED_API_KEY',
      defaultBaseURL: undefined,
      baseURLEnv: [],
      hasNativeAuth: true,
      keyRemoval: { ref: 'SAVED_API_KEY' },
      keyText: '',
      keyValue: '',
      probeApi: 'openai-responses',
      credentialRequired: true,
      t,
      protocolNeedsKey,
    })
    expect(reads.clearsDerivedRef).toBe(true)
    expect(reads.protocolNeedsKeyHere).toBe(false)
  })
})

describe('field edits', () => {
  it('clears a whitespace-only value and stores anything else', () => {
    const cleared = fieldEdit(settingsSchema, 'baseURL', '   ')
    expect(cleared({ baseURL: 'https://example.test' })).toEqual({})
    const stored = fieldEdit(
      settingsSchema,
      'baseURL',
      'https://example.test/v2',
    )
    expect(stored({})).toEqual({ baseURL: 'https://example.test/v2' })
  })

  it('reads the draft protocol before the stored one', () => {
    expect(
      probeApiOf(settingsSchema, { api: 'openai-responses' }, savedProfile),
    ).toBe('openai-responses')
    expect(probeApiOf(settingsSchema, {}, savedProfile)).toBe(
      'openai-responses',
    )
  })
})

describe('protocol choices', () => {
  it('offers the choices a stored profile names', () => {
    expect(protocolChoices(namespaceWithProfile(), settingsSchema)).toContain(
      'openai-responses',
    )
  })
})

describe('ProviderEditor without a resolvable profile', () => {
  it('names the unresolvable position instead of a blank card', () => {
    const props: ProviderEditorProps = {
      provider: 'missing',
      displayName: 'Missing',
      namespace: wireNamespaces().find(view => view.ns === 'llm-pi-ai')!,
      settingsPath: ['does-not-exist', 'missing'],
      schema: settingsSchema,
      operations: operationsWith(scriptedFace().face),
      t,
      readOnly: false,
      onClose: vi.fn(),
    }
    const view = render(<ProviderEditor {...props} />)
    expect(view.container.textContent).toContain(en.settingsPathUnresolvable)
  })
})
