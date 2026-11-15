/** The standalone SDK-minimal bundle's complete declared Cordis tree. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseEntryYaml } from '@noharness/cordis-plugin-include'

function packageName(specifier: string): string {
  return specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]!
}

describe('nhs-sdk-minimal bundle', () => {
  it('declares one standalone allowlisted tree with every row dependency', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      nhs?: { bundle?: { patch?: string } }
    }
    expect(manifest.nhs?.bundle?.patch).toBe('./cordis.patch.yml')
    const patches = parseEntryYaml(readFileSync(resolve(root, manifest.nhs!.bundle!.patch!), 'utf8')) as Array<{ insert?: Array<{ id?: string; inject?: string[]; name?: string; config?: Record<string, unknown>; disabled?: unknown }> }>
    expect(patches).toHaveLength(1)
    const rows = patches[0]?.insert ?? []
    expect(rows.map(row => [row.id, row.name])).toEqual([
      ['sdk-app-startup', '@noharness/sdk-app'],
      ['sdk-jsonrpc-server', '@noharness/sdk-jsonrpc-server'],
      ['deepseek-llm-api-extensions', '@noharness/deepseek-llm-api-extensions'],
      ['session-log-deepseek', '@noharness/session-log-deepseek'],
      ['plugin-package-inventory-deepseek', '@noharness/plugin-package-inventory-deepseek'],
      ['llm-deepseek', '@noharness/llm-deepseek-api-key'],
      ['sandbox', '@noharness/sandbox-local'],
      ['filesystem', '@noharness/fs-local'],
      ['attachment-local', '@noharness/attachment-local'],
      ['tool-fs', '@noharness/tool-fs'],
      ['working-directory', '@noharness/working-directory'],
      ['tool-working-directory', '@noharness/tool-working-directory'],
      ['session-projection', '@noharness/session-projection'],
      ['token-meter', '@noharness/token-meter'],
      ['compaction-basic', '@noharness/compaction-basic'],
      ['image-offload', '@noharness/compaction-image-offload'],
      ['sandbox-policy', '@noharness/sandbox-policy'],
      ['subprocess', '@noharness/subprocess-local'],
      ['pty', '@noharness/terminal'],
      ['terminal-bash', '@noharness/terminal-bash'],
      ['terminal-pwsh', '@noharness/terminal-bash'],
      ['timer', '@noharness/cordis-plugin-timer'],
      ['llm', '@noharness/llm'],
      ['session', '@noharness/session'],
      ['session-title', '@noharness/session-title'],
      ['system-prompt', '@noharness/system-prompt'],
      ['tools', '@noharness/tools'],
      ['tool-executor-native', '@noharness/tool-executor-native'],
      ['mcp-resources', '@noharness/mcp-resources'],
      ['agent', '@noharness/agent'],
      ['llm-retry', '@noharness/llm-retry'],
      ['jobs', '@noharness/jobs-local'],
      ['agent-loop', '@noharness/agent-loop'],
      ['persistent-bash', '@noharness/tool-bash-persistent'],
      ['persistent-pwsh', '@noharness/tool-pwsh-persistent'],
      ['sessions', '@noharness/session-persistence-jsonl'],
      ['session-checkpoint-policy', '@noharness/session-checkpoint-policy'],
    ])
    expect(rows.find(row => row.id === 'sdk-app-startup')?.config).toEqual({ profile: 'sdk-minimal' })
    expect(rows.find(row => row.id === 'sdk-jsonrpc-server')).toMatchObject({
      inject: ['sdkAppStartup', 'loader'],
      config: { maxTokensAsSuccess: false },
    })
    expect(rows.find(row => row.id === 'llm-deepseek')?.config).toEqual({
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      defaultContextWindow: { __jsExpr: 'Number(process.env.NHS_CONTEXT_WINDOW ?? 1000000)' },
      streamIdleTimeoutMs: 172800000,
    })
    expect(rows.find(row => row.id === 'system-prompt')?.config).toEqual({
      includeHarnessIdentity: false,
      includeRuntimeContext: false,
      personaPrefix: { __jsExpr: "process.env.NHS_SYSTEM_PROMPT ?? 'You are a helpful software engineer assistant.'" },
    })
    expect(rows.find(row => row.id === 'agent-loop')?.config).toEqual({ agents: [] })
    expect(rows.find(row => row.id === 'tool-fs')?.config).toEqual({ read: false, readImage: true, write: false, edit: false })
    expect(rows.find(row => row.id === 'compaction-basic')?.config).toBeUndefined()
    expect(rows.find(row => row.id === 'terminal-bash')).toMatchObject({
      disabled: { __jsExpr: "process.platform === 'win32'" },
    })
    expect(rows.find(row => row.id === 'terminal-pwsh')).toMatchObject({
      disabled: { __jsExpr: "process.platform !== 'win32'" },
      config: { shellDialect: 'pwsh', timeoutMs: 300000 },
    })
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual(
      [...new Set(rows.map(row => row.name).filter((name): name is string => name !== undefined).map(packageName))].sort(),
    )
  })
})
