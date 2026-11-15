/**
 * Registry tests for `@noharness/shell-env`: built-in facts, contributor
 * ownership and validation, collection ordering, effect-scoped disposal, and
 * the explicit disposer contract.
 */

import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@noharness/cordis'
import type { ToolCallId } from '@noharness/llm'
import type { Agent } from '@noharness/agent'
import { SESSION_FORMAT_VERSION } from '@noharness/session'
import type { ToolExecution } from '@noharness/tools'
import { ShellEnvRegistry } from '@noharness/shell-env'
import * as BashEnvPlugin from '@noharness/shell-env'
import { brandString } from '@noharness/brand'

const testToolSignal = new AbortController().signal

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

function execution(sessionId?: string): ToolExecution {
  return {
    signal: testToolSignal,
    token: Symbol('bash-env-test') as ToolExecution['token'],
    callId: brandString<ToolCallId>('bash-env-call'),
    rootCallId: brandString<ToolCallId>('bash-env-call'),
    name: 'bash',
    arguments: { command: 'true' },
    ...(sessionId === undefined
      ? {}
      : {
        agent: {
          session: {
            header: { version: SESSION_FORMAT_VERSION, id: sessionId, createdAt: 0, isSeeded: false },
          },
        } as unknown as Agent,
      }),
  }
}

describe('ShellEnvRegistry', () => {
  it('collects unconditional shell facts and the current agent session id', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { nhsHome: './test-nhs-home' })

    expect(registry.collect(execution())).toEqual({
      NHS_HOME: resolve('./test-nhs-home'),
      NHS_NODE_EXECUTABLE: process.execPath,
      NHS_SHELL: '1',
    })
    expect(registry.collect(execution('session-a'))).toEqual({
      NHS_HOME: resolve('./test-nhs-home'),
      NHS_NODE_EXECUTABLE: process.execPath,
      NHS_SESSION_ID: 'session-a',
      NHS_SHELL: '1',
    })
  })

  it('omits the Node executable inside a single-executable application', () => {
    vi.spyOn(process, 'getBuiltinModule').mockReturnValue({ isSea: () => true })
    expect(new ShellEnvRegistry(new Context()).collect(execution())).not.toHaveProperty('NHS_NODE_EXECUTABLE')
  })

  it('keeps the Node executable where the runtime answers no single-executable module', () => {
    vi.spyOn(process, 'getBuiltinModule').mockReturnValue(undefined)
    expect(new ShellEnvRegistry(new Context()).collect(execution()).NHS_NODE_EXECUTABLE).toBe(process.execPath)
  })

  it('collects the launcher-provided profile name, directory, and installation directory when a profile context exists', () => {
    const ctx = new Context()
    ctx.provide('profileContext', {
      name: 'web', dir: '/profiles/web', patchPath: '/profiles/web/cordis.patch.yml', installAnchor: '/nhs/package.json',
      cwd: '/work', home: '/home', startedBundles: [], overlays: [], telemetryDisabledEnv: undefined,
    })
    const registry = new ShellEnvRegistry(ctx, { nhsHome: './test-nhs-home' })
    expect(registry.collect(execution())).toMatchObject({
      NHS_INSTALL_DIR: '/nhs', NHS_PROFILE: 'web', NHS_PROFILE_DIR: '/profiles/web',
    })
    for (const key of ['NHS_PROFILE', 'NHS_INSTALL_DIR', 'NHS_NODE_EXECUTABLE']) {
      expect(() => registry.register({
        name: `${key}-claimer`,
        variables: { [key]: { description: 'Reserved key.' } },
        resolve: () => ({}),
      })).toThrow(new RegExp(`reserved key "${key}"`))
    }
  })

  it('resolves NHS_HOME from the ambient override or the user-home default', () => {
    vi.stubEnv('NHS_HOME', './ambient-nhs-home')
    const fromEnvironment = new ShellEnvRegistry(new Context())
    expect(fromEnvironment.collect(execution()).NHS_HOME).toBe(resolve('./ambient-nhs-home'))

    vi.stubEnv('NHS_HOME', undefined)
    const fromDefault = new ShellEnvRegistry(new Context())
    expect(fromDefault.collect(execution()).NHS_HOME).toBe(join(homedir(), '.nhs'))
  })

  it('collects declared contributor variables and omits unavailable values', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { nhsHome: './test-nhs-home' })
    registry.register({
      name: 'optional-session-fact',
      variables: {
        NHS_SESSION_OPTIONAL: { description: 'Optional session-scoped test fact.' },
      },
      resolve: exec => exec.agent === undefined ? {} : { NHS_SESSION_OPTIONAL: exec.agent.session.header.id },
    })
    registry.register({
      name: 'always-available-fact',
      variables: {
        NHS_ALWAYS_AVAILABLE: { description: 'Always-available test fact.' },
      },
      resolve: () => ({ NHS_ALWAYS_AVAILABLE: 'yes' }),
    })

    expect(registry.collect(execution())).not.toHaveProperty('NHS_SESSION_OPTIONAL')
    expect(registry.collect(execution()).NHS_ALWAYS_AVAILABLE).toBe('yes')
    expect(registry.collect(execution('session-b')).NHS_SESSION_OPTIONAL).toBe('session-b')
    expect(registry.list()).toEqual([
      {
        contributor: 'always-available-fact',
        description: 'Always-available test fact.',
        key: 'NHS_ALWAYS_AVAILABLE',
      },
      {
        contributor: 'optional-session-fact',
        description: 'Optional session-scoped test fact.',
        key: 'NHS_SESSION_OPTIONAL',
      },
    ])
  })

  it('rejects duplicate variable ownership at registration time', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { nhsHome: './test-nhs-home' })
    registry.register({
      name: 'first',
      variables: { NHS_SHARED: { description: 'First owner.' } },
      resolve: () => ({ NHS_SHARED: 'first' }),
    })

    expect(() => registry.register({
      name: 'second',
      variables: { NHS_SHARED: { description: 'Second owner.' } },
      resolve: () => ({ NHS_SHARED: 'second' }),
    })).toThrow(/NHS_SHARED.*first.*second|NHS_SHARED.*second.*first/)
  })

  it('rejects duplicate contributor names and malformed declarations', () => {
    const registry = new ShellEnvRegistry(new Context(), { nhsHome: './test-nhs-home' })
    registry.register({
      name: 'declared',
      variables: { NHS_DECLARED: { description: 'Declared fact.' } },
      resolve: () => ({}),
    })

    expect(() => registry.register({
      name: 'declared',
      variables: { NHS_ANOTHER: { description: 'Another fact.' } },
      resolve: () => ({}),
    })).toThrow(/already registered/)
    expect(() => registry.register({
      name: ' ',
      variables: { NHS_BLANK_NAME: { description: 'Blank owner.' } },
      resolve: () => ({}),
    })).toThrow(/name must be non-empty/)
    expect(() => registry.register({
      name: 'invalid-key',
      variables: { nhs_invalid: { description: 'Invalid key.' } } as unknown as Record<'NHS_INVALID', { description: string }>,
      resolve: () => ({}),
    })).toThrow(/invalid key/)
    expect(() => registry.register({
      name: 'reserved-key',
      variables: { NHS_HOME: { description: 'Reserved key.' } },
      resolve: () => ({}),
    })).toThrow(/reserved key/)
    expect(() => registry.register({
      name: 'blank-description',
      variables: { NHS_BLANK_DESCRIPTION: { description: ' ' } },
      resolve: () => ({}),
    })).toThrow(/must describe/)
  })

  it('rejects undeclared variables returned by a contributor', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { nhsHome: './test-nhs-home' })
    registry.register({
      name: 'drifted-provider',
      variables: { NHS_DECLARED: { description: 'Declared fact.' } },
      resolve: () => ({ NHS_UNDECLARED: 'bad' }),
    })

    expect(() => registry.collect(execution())).toThrow(/drifted-provider.*NHS_UNDECLARED/)
    expect(() => registry.collect(execution())).toThrow(expect.objectContaining({ name: 'ShellEnvError', code: 'SHELL_ENV_CONTRIBUTION_INVALID' }))
  })

  it('rejects non-string values returned by a contributor', () => {
    const registry = new ShellEnvRegistry(new Context(), { nhsHome: './test-nhs-home' })
    registry.register({
      name: 'wrong-value-type',
      variables: { NHS_STRING: { description: 'String fact.' } },
      resolve: () => ({ NHS_STRING: 42 }) as unknown as Record<'NHS_STRING', string>,
    })

    expect(() => registry.collect(execution())).toThrow(/wrong-value-type.*non-string.*NHS_STRING/)
    expect(() => registry.collect(execution())).toThrow(expect.objectContaining({ name: 'ShellEnvError', code: 'SHELL_ENV_CONTRIBUTION_INVALID' }))
  })

  it('removes an effect-scoped contributor when its plugin is disposed', async () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { nhsHome: './test-nhs-home' })
    const fiber = await ctx.plugin({
      inject: ['shellEnv'],
      apply(inner: Context) {
        inner.shellEnv.register({
          name: 'temporary',
          variables: { NHS_TEMPORARY: { description: 'Temporary fact.' } },
          resolve: () => ({ NHS_TEMPORARY: 'present' }),
        })
      },
    })

    expect(registry.collect(execution()).NHS_TEMPORARY).toBe('present')
    await fiber.dispose()
    expect(registry.collect(execution())).not.toHaveProperty('NHS_TEMPORARY')
  })

  it('returns an explicit contributor disposer', () => {
    const registry = new ShellEnvRegistry(new Context(), { nhsHome: './test-nhs-home' })
    const dispose = registry.register({
      name: 'explicit-disposal',
      variables: { NHS_EXPLICIT_DISPOSAL: { description: 'Explicitly disposed fact.' } },
      resolve: () => ({ NHS_EXPLICIT_DISPOSAL: 'present' }),
    })

    expect(registry.collect(execution()).NHS_EXPLICIT_DISPOSAL).toBe('present')
    dispose()
    expect(registry.collect(execution())).not.toHaveProperty('NHS_EXPLICIT_DISPOSAL')
  })

  it('the plugin registers the service with no contributors on load', async () => {
    const ctx = new Context()
    await ctx.plugin(BashEnvPlugin)
    expect(ctx.shellEnv).toBeInstanceOf(ShellEnvRegistry)
    expect(ctx.shellEnv.list()).toEqual([])
  })
})
