import { describe, expect, it } from 'vitest'
import { Context } from '@noharness/cordis'
import { CONTEXT_WINDOW_EXCEEDED_CODE, createUserMessage } from '@noharness/llm'
import type { GenerateOptions, LlmResolvedModelInfo, StreamChunk } from '@noharness/llm'
import { LlmAdapter } from '@noharness/llm'
import { brandString } from '@noharness/brand'
import { AgentLoop } from '@noharness/agent-loop'
import { mountAgentLoopTestDependencies } from '@noharness/agent-loop-testkit'
import { BasicCompactionEngine } from '@noharness/compaction-basic'
import TokenMeter from '@noharness/token-meter'
import type { Session, SessionId } from '@noharness/session'

/**
 * The fixed estimate undercounts CJK text roughly one character per token, so a
 * provider that reports real usage can already be over its window while the
 * heuristic still reads below the threshold. Pressure decisions must use the
 * provider-reported count whenever it is larger.
 */

const SMALL_WINDOW = 60_000
const HEURISTIC_TEXT = '上下文'.repeat(667)
/** Provider-reported prompt size for one `big` turn, far above the heuristic. */
const REPORTED_INPUT_TOKENS = 50_000

/** `big` accepts everything; `small` rejects requests the provider says exceed its window. */
class ReportedPressureAdapter extends LlmAdapter {
  readonly requests: Array<{ kind: 'chat' | 'summary'; model: string; overflow: boolean }> = []
  /** Context capacity the `small` model advertises; `undefined` advertises none. */
  smallContext: { contextWindow: number } | undefined = { contextWindow: SMALL_WINDOW }
  /** Prompt tokens `small` counts per character before reporting real usage. */
  reportInputTokens = REPORTED_INPUT_TOKENS

  override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    const contextWindow = model === 'small' ? this.smallContext : { contextWindow: 1_000_000 }
    return Promise.resolve(contextWindow === undefined
      ? { provider, id: model, name: model }
      : { provider, id: model, name: model, context: contextWindow })
  }

  override async * stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const characters = options.messages.reduce((total, message) => total + message.content
      .reduce((sum, block) => sum + (block.type === 'text' ? block.text.length : 0), 0), 0)
    const kind = options.purpose === 'compaction' ? 'summary' : 'chat'
    const source = options.messages.at(-1)?.content
      .map(block => (block.type === 'text' ? block.text : ''))
      .join('') ?? ''
    // The summarizer replays the prefix and marks its call by the trailing instruction;
    // it is priced by the rough count the provider in this fixture charges per character.
    const tokens = kind === 'summary' ? Math.ceil(characters / 4) : this.reportInputTokens
    const overflow = options.model === 'small' && tokens > SMALL_WINDOW
    this.requests.push({ kind, model: options.model, overflow })
    if (overflow) {
      yield {
        type: 'finish',
        reason: {
          kind: 'error',
          failure: {
            message: `prompt is too long: ${tokens} tokens > ${SMALL_WINDOW} maximum`,
            code: CONTEXT_WINDOW_EXCEEDED_CODE,
          },
        },
      }
      return
    }
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: kind === 'summary' ? 'CHECKPOINT' : `answer ${source.length}` } }
    yield { type: 'usage', usage: { inputTokens: tokens, outputTokens: 1 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

interface Harness {
  readonly ctx: Context
  readonly adapter: ReportedPressureAdapter
  readonly session: Session
  readonly prompt: (text: string) => Promise<void>
  /** Latest durable surface size under the fixed heuristic, for the precondition. */
  readonly heuristicTokens: () => number
}

/**
 * Three `big` turns of CJK history. The fixed estimate prices the whole surface
 * below the `small` threshold while the provider reports each prompt at
 * `REPORTED_INPUT_TOKENS`, which the target keeps in its reported usage.
 */
async function harness(maxOverflowRetries = 1): Promise<Harness> {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(TokenMeter)
  const adapter = new ReportedPressureAdapter()
  ctx.llm.registerAdapter(['big', 'small'], adapter)
  ctx.plugin(BasicCompactionEngine, {
    auto: true,
    headroomTokens: 0,
    maxTokens: 64,
    maxOverflowRetries,
  })
  const agent = await ctx.agentLoop.create(brandString<SessionId>('reported-pressure'), {
    provider: 'big',
    model: 'big',
  })
  const prompt = async (text: string): Promise<void> => {
    agent.followup(createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } }))
    await agent.whenIdle()
  }
  for (let turn = 0; turn < 3; turn += 1) await prompt(HEURISTIC_TEXT)
  return {
    ctx,
    adapter,
    session: agent.session,
    prompt,
    heuristicTokens: () => ctx.tokenMeter.measure(agent.session).totalTokens,
  }
}

function turnEnds(harnessed: Harness): unknown {
  return harnessed.session.snapshotEvents().find(event => event.type === 'turn/end')
}

function selectSmall(harnessed: Harness): void {
  harnessed.session.append('model/selection', { provider: 'small', model: 'small' })
}

describe('compaction pressure uses the provider-reported prompt size', () => {
  it('compacts before a switch request when reported usage already exceeds the target window', async () => {
    const harnessed = await harness()
    try {
      harnessed.adapter.requests.length = 0
      selectSmall(harnessed)
      await harnessed.prompt('继续')

      expect(harnessed.adapter.requests).toEqual([{ kind: 'chat', model: 'small', overflow: false }])
      expect(turnEnds(harnessed)).toMatchObject({ data: { reason: { kind: 'completed' } } })
    } finally {
      await harnessed.ctx.fiber.dispose()
    }
  })

  it('degrades a switch it cannot compact instead of failing the request', async () => {
    const harnessed = await harness(0)
    try {
      // Nothing can be summarized: the only safe range is the whole surface and
      // the pruner has nothing to free, so the switch has no room to shrink into.
      selectSmall(harnessed)
      await harnessed.prompt('继续')

      expect(turnEnds(harnessed)).toMatchObject({ data: { reason: { kind: 'completed' } } })
    } finally {
      await harnessed.ctx.fiber.dispose()
    }
  })

  it('keeps a target adapter without a declared window usable', async () => {
    const harnessed = await harness()
    try {
      harnessed.adapter.smallContext = undefined
      harnessed.adapter.requests.length = 0
      selectSmall(harnessed)
      await harnessed.prompt('继续')

      const events = harnessed.session.snapshotEvents()
      expect(events.filter(event => event.type === 'compaction/summary')).toHaveLength(0)
      expect(turnEnds(harnessed)).toMatchObject({ data: { reason: { kind: 'completed' } } })
    } finally {
      await harnessed.ctx.fiber.dispose()
    }
  })
})
