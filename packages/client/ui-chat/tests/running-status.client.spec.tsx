// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTranslate } from '@noharness/client-test-runtime'
import { ja as commonJa } from '@noharness/client-locale/src/locales/ja.ts'
import { RunningStatus } from '../src/client/chat/RunningStatus.tsx'
import { ja } from '../src/client/locale.ts'

const t = makeTranslate(ja, commonJa)
const escapeRe = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const runningFor = (seconds: number): string => t('chat.deepDivingFor', { duration: `${seconds}${t('duration.secondUnit')}` })
const runningPattern = (): RegExp =>
  new RegExp('^' + escapeRe(t('chat.deepDivingFor')).split(escapeRe('{duration}')).join('\\d+' + escapeRe(t('duration.secondUnit'))) + '$')

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(5_000) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

function statusHarness(startTime?: number) {
  const view = render(<RunningStatus startTime={startTime} paused={false} t={t} />)
  return {
    ...view,
    content: () => view.container.querySelector('[data-chat-running] > :last-child'),
    set: (nextStartTime?: number, paused = false) => {
      view.rerender(<RunningStatus startTime={nextStartTime} paused={paused} t={t} />)
    },
  }
}

describe('RunningStatus', () => {
  it('waits for an open Turn start before allocating its clock', () => {
    const view = statusHarness()
    expect(view.content()?.textContent).toBe(ja['chat.deepDiving'])
    expect(vi.getTimerCount()).toBe(0)
    view.set(1_000)
    expect(view.content()?.textContent).toMatch(runningPattern())
    expect(view.content()?.querySelectorAll('[data-shimmer="true"]')).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(1)
    view.set()
    expect(view.content()?.textContent).toBe(ja['chat.deepDiving'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps the indicator mounted while a continuous run moves to the next Turn', () => {
    const view = statusHarness(1_000)
    const content = view.content()
    const status = view.getByRole('status')
    const initialText = content?.textContent
    act(() => { vi.advanceTimersByTime(2_000) })
    expect(content?.textContent).toMatch(runningPattern())
    expect(content?.textContent).not.toBe(initialText)
    view.set(7_000)
    expect(view.content()).toBe(content)
    expect(content?.textContent).toMatch(runningPattern())
    expect(vi.getTimerCount()).toBe(1)
    const nextTurnText = content?.textContent
    act(() => { vi.advanceTimersByTime(2_000) })
    expect(content?.textContent).toMatch(runningPattern())
    expect(content?.textContent).not.toBe(nextTurnText)
    expect(view.getByRole('status')).toBe(status)
    expect(status.textContent).toBe(ja['chat.deepDiving'])
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps the duration nonnegative when the start is ahead of the local clock', () => {
    const view = statusHarness(6_000)
    expect(view.content()?.textContent).toMatch(runningPattern())
    expect(view.content()?.textContent).not.toContain('-')
    act(() => { vi.advanceTimersByTime(3_000) })
    expect(view.content()?.textContent).toMatch(runningPattern())
    expect(view.content()?.textContent).not.toContain('-')
  })

  it('freezes the duration while paused and resumes from the Turn start', () => {
    const view = statusHarness(1_000)
    expect(view.content()?.textContent).toBe(runningFor(4))
    view.set(1_000, true)
    expect(vi.getTimerCount()).toBe(0)
    act(() => { vi.advanceTimersByTime(5_000) })
    expect(view.content()?.textContent).toBe(runningFor(4))
    view.set(1_000)
    expect(view.content()?.textContent).toBe(runningFor(9))
    expect(vi.getTimerCount()).toBe(1)
  })
})
