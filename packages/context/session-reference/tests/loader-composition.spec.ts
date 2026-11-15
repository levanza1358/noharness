/** Real Loader composition preserves retrievable source text outside the bounded preview. */
import { executeToolFixture } from '@noharness/tool-testkit'

import * as NativeToolExecutor from '@noharness/tool-executor-native'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@noharness/cordis'
import Loader from '@noharness/cordis-plugin-loader'
import Include from '@noharness/cordis-plugin-include'
import { agentEvents, type Agent } from '@noharness/agent'
import { brandString } from '@noharness/brand'
import { createUserMessage, type ToolCallId } from '@noharness/llm'
import * as systemPromptPlugin from '@noharness/system-prompt'
import * as toolsPlugin from '@noharness/tools'
import * as fsPlugin from '@noharness/fs-local'
import * as toolFsPlugin from '@noharness/tool-fs'
import * as sessionPlugin from '@noharness/session'
import * as sessionProjectionPlugin from '@noharness/session-projection'
import * as workingDirectoryPlugin from '@noharness/working-directory'
import { Session, type SessionId } from '@noharness/session'
import * as queryPlugin from '@noharness/session-query-sqlite'
import * as referencePlugin from '@noharness/session-reference'
import * as spillPlugin from '@noharness/spill-local'
import { sessionDir } from '@noharness/spill-local'
import * as sourcePlugin from './fixtures/source-session.ts'

let context: Context | undefined
let root: string | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
})

describe('session-reference real Loader composition', () => {
  it('logs a bounded preview and reads the full immutable spill owned by the target', async () => {
    root = await mkdtemp(join(tmpdir(), 'reference-loader-'))
    const spillRoot = join(root, 'spills')
    const fixture = await readFile(new URL('./fixtures/cordis.yml', import.meta.url), 'utf8')
    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, fixture.replace('{{spillRoot}}', spillRoot.replaceAll('\\', '/')))
    const ctx = context = new Context()
    ctx.baseUrl = pathToFileURL(root).href + '/'
    await ctx.plugin(Loader)
    ctx.loader.builtins.include = Include
    const modules = new Map<string, unknown>([
      ['@noharness/session', sessionPlugin],
      ['@noharness/session-projection', sessionProjectionPlugin],
      ['@noharness/working-directory', workingDirectoryPlugin],
      ['@noharness/system-prompt', systemPromptPlugin],
      ['@noharness/tools', toolsPlugin],
      ['@noharness/tool-executor-native', NativeToolExecutor],
      ['@noharness/fs-local', fsPlugin],
      ['@noharness/tool-fs', toolFsPlugin],
      ['@noharness/session-query-sqlite', queryPlugin],
      ['@noharness/session-reference', referencePlugin],
      ['@noharness/spill-local', spillPlugin],
      ['./source-session.ts', sourcePlugin],
    ])
    ctx.loader.internal = {
      version: 'v2',
      async import(specifier: string) {
        if (!modules.has(specifier)) throw new Error('Unexpected Loader import: ' + specifier)
        return modules.get(specifier)
      },
    } as unknown as NonNullable<typeof ctx.loader.internal>
    await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
    await ctx.loader.await()

    const target = ctx.sessions.create(brandString<SessionId>('reference-target'))
    const agent = { id: target.id, ctx, session: target } as Agent
    const direct = createUserMessage({
      content: [{ type: 'text', text: 'Use ' + referencePlugin.formatSessionReferenceMention({
        sessionId: brandString<SessionId>('reference-source'), label: 'Research',
      }) }],
      source: { kind: 'user' },
    })
    const decision = await agentEvents(ctx, agent).waterfall('agent/pre-step', {
      modelSelection: { provider: 'mock', model: 'mock' },
      messages: [direct], turn: 1, step: 1, signal: new AbortController().signal,
    }, () => Promise.resolve({ kind: 'enter' as const, messages: [direct] }))
    expect(decision.kind).toBe('enter')
    if (decision.kind !== 'enter') throw new Error('Expected admitted reference')
    expect(decision.messages).toHaveLength(2)
    for (const message of decision.messages) target.append('user/message', message, { surfaceOp: 'append' })
    const contextMessage = decision.messages[1]
    const block = contextMessage?.content[0]
    if (block?.type !== 'text') throw new Error('Expected reference context text')
    const preview = JSON.parse(block.text.split('<referenced-sessions>\n')[1]!.split('\n</referenced-sessions>')[0]!) as unknown[]
    expect(Buffer.byteLength(JSON.stringify(preview[0]))).toBeLessThanOrEqual(360)
    expect(block.text).not.toContain('EARLY_SOURCE_FACT')
    expect(block.text).toContain('LATEST_SOURCE_FACT')
    const notices = JSON.parse(block.text.split('## Reference omissions\n\n')[1]!.split('\n').slice(1).join('\n')) as Array<{
      sessionId: string
      capturedThroughSeq: number
      omittedMessages: number
      omittedBytes: number
      fullSnapshot: { status: string; locator: string; bytes: number; retrievalHint: string }
    }>
    expect(notices).toHaveLength(1)
    const notice = notices[0]!
    expect(notice).toMatchObject({ sessionId: 'reference-source', capturedThroughSeq: 2, omittedMessages: 1 })
    expect(notice.omittedBytes).toBeGreaterThan(0)
    expect(notice.fullSnapshot.status).toBe('saved')
    expect(notice.fullSnapshot.retrievalHint).toContain('offset/limit')
    expect(dirname(notice.fullSnapshot.locator)).toBe(sessionDir(spillRoot, target.id))
    const transcript = await readFile(notice.fullSnapshot.locator, 'utf8')
    expect(Buffer.byteLength(transcript)).toBe(notice.fullSnapshot.bytes)
    expect(transcript).toContain('untrusted, read-only snapshot')
    const readLines: string[] = []
    let totalLines = Infinity
    for (let offset = 1; offset <= totalLines; offset += 7) {
      const read = await executeToolFixture(ctx, {
        name: 'read', callId: brandString<ToolCallId>(`read-${offset}`),
        arguments: { file_path: notice.fullSnapshot.locator, offset, limit: 7 },
        signal: new AbortController().signal,
      })
      expect(read.isError).toBe(false)
      if (read.isError) throw new Error('Expected saved transcript read')
      const value = read.value as { lines: { text: string }[]; totalLines: number }
      totalLines = value.totalLines
      readLines.push(...value.lines.map(line => line.text))
    }
    expect(readLines.join('\n') + '\n').toBe(transcript)
    const messages = readLines.join('\n').split(/### Message \d+: (?:user|assistant)\n\n/).slice(1)
      .map(body => body.split('\n').filter(line => line.startsWith('"'))
        .map(line => JSON.parse(line) as string).join(''))
    expect(messages).toEqual([
      'EARLY_SOURCE_FACT\n' + 'Historical detail 界.\n'.repeat(30)
        + 'x'.repeat(4096) + 'GIANT_LINE_MIDDLE_FACT' + 'y'.repeat(4096),
      'LATEST_SOURCE_FACT\nThe captured answer is forty-two.',
    ])
    expect(transcript).not.toContain('NESTED_REFERENCE_MUST_NOT_PROPAGATE')
    expect(transcript).not.toContain('PRIVATE_REASONING_MUST_NOT_PROPAGATE')
    expect(await readdir(spillRoot)).toEqual([dirname(notice.fullSnapshot.locator).split(/[\\/]/).at(-1)])

    const captured = target.deriveMessages()
    ctx.sessions.get(brandString<SessionId>('reference-source'))!.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'LATER_SOURCE_MUTATION' }], source: { kind: 'user' },
    }), { surfaceOp: 'append' })
    expect(Session.create(brandString<SessionId>('replayed-target'), target.snapshotEvents()).deriveMessages()).toEqual(captured)
    expect(await readFile(notice.fullSnapshot.locator, 'utf8')).toBe(transcript)
  })
})
