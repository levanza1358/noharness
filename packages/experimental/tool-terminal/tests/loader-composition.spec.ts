import { executeToolFixture } from '@noharness/tool-testkit'
import * as NativeToolExecutor from '@noharness/tool-executor-native'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { unsupportedModel, provideWorkingDirectoryFixture, unsupportedInbox } from '@noharness/agent-loop-testkit'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@noharness/cordis'
import Loader from '@noharness/cordis-plugin-loader'
import Include from '@noharness/cordis-plugin-include'
import { brandString } from '@noharness/brand'
import type { ToolCallId } from '@noharness/llm'
import { Session, type SessionId } from '@noharness/session'
import AgentRegistry from '@noharness/agent'
import type { Agent } from '@noharness/agent'
import SystemPrompt from '@noharness/system-prompt'
import ToolRuntime from '@noharness/tools'
import TerminalSessionService from '@noharness/terminal'
import SandboxProvider from '@noharness/sandbox'
import type { ConfinedArgv, SandboxPolicy } from '@noharness/sandbox'
import SandboxPolicyService from '@noharness/sandbox-policy'
import SessionProjectionRegistry from '@noharness/session-projection'
import LocalSubprocessRuntime from '@noharness/subprocess-local'
import * as TerminalLocal from '@noharness/terminal-bash'
import * as ToolPty from '@noharness/tool-terminal'

let root: string | undefined
let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
})

class PassthroughSandbox extends SandboxProvider {
  async confine(argv: readonly string[], _policy: SandboxPolicy): Promise<ConfinedArgv> {
    return { argv: [...argv], enforcement: 'full', denialSignatures: [], runnerFailureRules: [] }
  }
}

async function agent(ctx: Context): Promise<Agent> {
  const scope = ctx.plugin(() => {})
  const id = brandString<SessionId>('pty-loader-agent')
  const session = Session.create(id)
  const value: Agent = {
    id, options: {}, session, model: unsupportedModel(),
    inbox: unsupportedInbox(),
    status: 'idle',
    ctx: scope.ctx,
    send: () => {},
    followup: () => {}, steer: () => {}, inject: () => {}, cancel() {},
    runMaintenance: job => job(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  await ctx.agents.register(value)
  return value
}

function resultText(result: { content: { type: string; text?: string }[] }): string {
  return result.content.filter(block => block.type === 'text').map(block => block.text).join('')
}

const suite = process.platform === 'linux' || process.platform === 'darwin' ? describe : describe.skip

suite('terminal real Loader composition through cordis.yml', () => {
  it('boots cordis.yml and preserves shell state across real tool calls', async () => {
    root = await mkdtemp(join(tmpdir(), 'nhs-pty-loader-'))
    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, [
      "- name: '@noharness/agent'",
      "- name: '@noharness/system-prompt'",
      "- name: '@noharness/tools'",
      "- name: '@noharness/tool-executor-native'",
      "- name: '@noharness/terminal'",
      "- name: '@noharness/test-sandbox'",
      "- name: '@noharness/session-projection'",
      "- name: '@noharness/sandbox-policy'",
      '  config:',
      '    mode: danger-full-access',
      `    workspaceRoot: ${JSON.stringify(root)}`,
      "- name: '@noharness/subprocess-local'",
      "- name: '@noharness/terminal-bash'",
      '  config:',
      '    pollIntervalMs: 10',
      '    exactProbeAfterMs: 20',
      '    idleSilenceMs: 250',
      '    handoffGraceMs: 250',
      '    timeoutMs: 2000',
      '    disposeGraceMs: 500',
      "- name: '@noharness/tool-terminal'",
      '',
    ].join('\n'))

    context = new Context()

    provideWorkingDirectoryFixture(context)
    context.baseUrl = pathToFileURL(root).href + '/'
    await context.plugin(Loader)
    context.loader.builtins.include = Include
    const modules = new Map<string, unknown>([
      ['@noharness/agent', AgentRegistry],
      ['@noharness/system-prompt', SystemPrompt],
      ['@noharness/tools', ToolRuntime],
      ['@noharness/tool-executor-native', NativeToolExecutor],
      ['@noharness/terminal', TerminalSessionService],
      ['@noharness/test-sandbox', PassthroughSandbox],
      ['@noharness/session-projection', SessionProjectionRegistry],
      ['@noharness/sandbox-policy', SandboxPolicyService],
      ['@noharness/subprocess-local', LocalSubprocessRuntime],
      ['@noharness/terminal-bash', TerminalLocal],
      ['@noharness/tool-terminal', ToolPty],
    ])
    context.loader.internal = {
      version: 'v2',
      async import(specifier: string) {
        if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
        return modules.get(specifier)
      },
    } as unknown as NonNullable<typeof context.loader.internal>
    await context.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
    await context.loader.await()

    const owner = await agent(context)
    const signal = new AbortController().signal
    const spawn = await executeToolFixture(context, {
      signal, callId: brandString<ToolCallId>('spawn'), name: 'terminal_open', arguments: { type: 'shell', name: 'main', cwd: root }, agent: owner,
    })
    expect(resultText(spawn)).toContain('started terminal session pty-1 (main)')

    await executeToolFixture(context, {
      signal, callId: brandString<ToolCallId>('state'), name: 'terminal_send', arguments: { sessionId: 'pty-1', text: 'export KEEP=loader; cd /' }, agent: owner,
    })
    const read = await executeToolFixture(context, {
      signal, callId: brandString<ToolCallId>('read'), name: 'terminal_send', arguments: { sessionId: 'pty-1', text: 'printf "cwd=%s keep=%s\\n" "$PWD" "$KEEP"' }, agent: owner,
    })
    expect(resultText(read)).toContain('cwd=/ keep=loader')
    expect(context.terminals.list(owner)).toHaveLength(1)
  }, 15_000)
})
