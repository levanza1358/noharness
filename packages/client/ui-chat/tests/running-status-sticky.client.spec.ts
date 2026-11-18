/**
 * The running-turn status as CSS text. jsdom has no layout, so the rendering
 * specs can only pin the DOM anchors; these read the declarations the pinning
 * and its mask depend on.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const read = (): string =>
  readFileSync(fileURLToPath(new URL('../src/client/chat/ChatView.module.css', import.meta.url)), 'utf8')

function declarationsFrom(source: string, selector: string): string[] {
  const declarationText = source.replace(/\/\*[\s\S]*?\*\//g, ' ')
  const rule = new RegExp(`(?:^|[{}])\\s*${selector.replace(/[.[\]():*+^$\\]/g, '\\$&')}\\s*\\{([^{}]*)\\}`).exec(declarationText)
  if (rule === null) throw new Error(`no \`${selector}\` rule`)
  return (rule[1] ?? '').split(';').map(part => part.trim()).filter(Boolean)
}

describe('running turn status', () => {
  it('pins above the composer while the reader scrolls older turns', () => {
    expect(declarationsFrom(read(), '.running')).toEqual(expect.arrayContaining([
      'position: sticky',
      // The composer seat is sticky at the scrollport floor and paints over the
      // flow, so the status stops at the seat's height rather than at `0`.
      'bottom: var(--nhs-composer-height, 0px)',
      'z-index: 1',
    ]))
  })

  it('masks the rows passing beneath the pinned status', () => {
    expect(declarationsFrom(read(), '.running::before')).toEqual(expect.arrayContaining([
      "content: ''",
      'position: absolute',
      'inset: calc(-1 * var(--nhs-chat-flow-gap, 12px)) 0 -4px',
      'background: var(--dsw-alias-bg-base)',
      'z-index: -1',
      'pointer-events: none',
    ]))
  })
})
