import type { ProductEvent } from '@noharness/client-product-analytics/types'
/** Native workspace operations using the shared Web authentication and RPC APIs. */

import { randomUUID } from 'node:crypto'
import { desktopAccountBackend, type DesktopAccountBackend } from './account-backend.ts'

/** Metadata needed before the workspace becomes visible. */
export interface DesktopWorkspaceStartupState {
  readonly hasApiKey: boolean
  readonly localePreference: string | null
  /** Effective Host theme preference; absent or invalid optional theme settings use system appearance. */
  readonly themePreference: 'light' | 'dark' | 'system'
}

/** Narrow Host operations available to the desktop shell. */
export interface DesktopWorkspaceBackend {
  /** @returns the current Host policy; every read observes live configuration. */
  analyticsEnabled(): Promise<boolean>
  readonly account: DesktopAccountBackend
  /** @param event - desktop-owned fields. @returns after local Host intake. */
  report(event: ProductEvent): Promise<void>
  /** @returns Configured-key presence and the shared language and theme preferences, without credential values. */
  readStartupState(): Promise<DesktopWorkspaceStartupState>
  /** @returns The saved UI language without account or provider requests. */
  readLocalePreference(): Promise<string | null>
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Connect the native HTTP client to the Desktop Host; every request sends `cookie` explicitly and uses no cookie jar.
 * @param hostUrl - URL of the running Desktop Host; only its origin is used.
 * @param cookie - Desktop-private authentication header for this owned Host.
 * @param send - HTTP client for Host requests.
 * @returns policy reads, analytics reporting, and startup metadata over standard RPC.
 */
export function connectDesktopWorkspace(
  hostUrl: string,
  cookie: string,
  send: (input: string, init?: RequestInit) => Promise<Response> = fetch,
): DesktopWorkspaceBackend {
  const origin = new URL(hostUrl).origin
  const invoke = async (
    request: { namespace: string; method: string; args: Record<string, unknown> },
    signal?: AbortSignal,
  ): Promise<unknown> => {
    const rpcId = randomUUID()
    const method = `${request.namespace}/${request.method}`
    const response = await send(new URL(`/api/${method}`, origin).href, {
      method: 'POST', redirect: 'error', ...(signal === undefined ? {} : { signal }),
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ type: 'client-request', rpcId, method, payload: { args: request.args } }),
    })
    if (!response.ok) throw new Error('desktop workspace: Web request failed')
    const envelope: unknown = await response.json()
    if (!record(envelope) || envelope.type !== 'server-response' || envelope.rpcId !== rpcId
      || !record(envelope.result) || envelope.result.ok !== true) {
      throw new Error('desktop workspace: Web RPC failed')
    }
    return envelope.result.value
  }
  const account = desktopAccountBackend(origin, invoke, cookie)
  const settingsNamespaces = async (): Promise<unknown[]> => {
    const settings = await invoke({ namespace: 'settings', method: 'describe', args: {} })
    if (!record(settings) || !Array.isArray(settings.namespaces)) throw new Error('desktop workspace: missing settings namespaces')
    return settings.namespaces
  }
  const localePreference = (namespaces: unknown[]): string | null => {
    const locale: unknown = namespaces.find((item: unknown) => record(item) && item.ns === 'locale')
    if (!record(locale) || !record(locale.value)
      || (locale.value.preference !== undefined && typeof locale.value.preference !== 'string')) {
      throw new Error('desktop workspace: invalid locale preference')
    }
    return locale.value.preference ?? null
  }
  const themePreference = (namespaces: unknown[]): DesktopWorkspaceStartupState['themePreference'] => {
    const theme = namespaces.find(item => record(item) && item.ns === 'ui-theme')
    if (theme === undefined) return 'system'
    const preference = record(theme) && record(theme.value) ? theme.value.preference : undefined
    if (preference === 'light' || preference === 'dark' || preference === 'system') return preference
    console.warn('desktop appearance: invalid Host theme preference; using system appearance')
    return 'system'
  }
  return {
    account,
    async readStartupState() {
      const namespaces = await settingsNamespaces()
      const providers = await invoke({ namespace: 'llm', method: 'listConfigurableProviders', args: {} })
      if (!Array.isArray(providers)) throw new Error('desktop workspace: invalid provider directory')
      const refs = providers.flatMap((provider: unknown) => {
        if (!record(provider) || typeof provider.settingsNs !== 'string' || !Array.isArray(provider.settingsPath)) {
          throw new Error('desktop workspace: invalid provider settings address')
        }
        const namespace: unknown = namespaces.find((item: unknown) => record(item) && item.ns === provider.settingsNs)
        let value: unknown = record(namespace) ? namespace.value : undefined
        for (const key of provider.settingsPath as unknown[]) {
          if (typeof key !== 'string') throw new Error('desktop workspace: invalid provider settings path')
          value = record(value) ? value[key] : undefined
        }
        return record(value) && typeof value.apiKeyEnv === 'string' ? [value.apiKeyEnv] : []
      })
      const unique = [...new Set(refs)]
      const states: Record<string, unknown> = {}
      // credentials.describe accepts at most 64 references per request.
      for (let offset = 0; offset < unique.length; offset += 64) {
        const batch = await invoke({ namespace: 'credentials', method: 'describe', args: { refs: unique.slice(offset, offset + 64) } })
        if (!record(batch)) throw new Error('desktop workspace: invalid credential metadata')
        Object.assign(states, batch)
      }
      return {
        hasApiKey: Object.values(states).some(value => record(value) && value.configured === true),
        localePreference: localePreference(namespaces),
        themePreference: themePreference(namespaces),
      }
    },
    async analyticsEnabled() {
      const enabled = await invoke({ namespace: 'productAnalytics', method: 'enabled', args: {} }, AbortSignal.timeout(1000))
      if (typeof enabled !== 'boolean') throw new Error('desktop analytics: invalid collection policy')
      return enabled
    },
    async report(event) { await invoke({ namespace: 'productAnalytics', method: 'report', args: { event } }, AbortSignal.timeout(1000)) },
    async readLocalePreference() { return localePreference(await settingsNamespaces()) },
  }
}
