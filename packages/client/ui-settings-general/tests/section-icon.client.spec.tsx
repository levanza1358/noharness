// @vitest-environment jsdom
import type { Context } from '@noharness/cordis'
import type { PropsRuntime } from '@noharness/client-ui-slots'
import { createClientTest, webApp } from '@noharness/client-test-runtime/src/assembly/index.ts'
import { usePinnedBrowserLanguages } from '@noharness/client-test-runtime'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { expect, onTestFinished } from 'vitest'

usePinnedBrowserLanguages('en-US')

const it = createClientTest({
  roster: webApp.without(['@noharness/client-ui-settings-models']),
}, { mount: true })

function Section() { return null }

function SectionIcon({ size, active }: PropsRuntime<'settings.section.icon'>) {
  return <svg width={size} height={size} viewBox="0 0 16 16" data-testid="section-icon" data-active={active}>
    <circle cx="8" cy="8" r="6" fill="currentColor" />
  </svg>
}

const contribution = {
  name: 'test-settings-icon',
  inject: ['slots'],
  apply(ctx: Context) {
    ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section', id: 'custom', label: 'Custom',
    }, Section))
    ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
      name: 'settings.section.icon', id: 'custom', label: 'Unused icon label',
    }, SectionIcon))
    ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
      name: 'settings.section.icon', id: 'unmatched',
    }, SectionIcon))
  },
}

it('renders a contributed section icon and restores the default after its plugin unloads', async ({ start }) => {
  // jsdom omits the browser method used when the settings row receives focus.
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value() {} })
  onTestFinished(() => {
    if (descriptor === undefined) Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
    else Object.defineProperty(Element.prototype, 'scrollIntoView', descriptor)
  })
  const c = await start()
  const plugin = c.ctx.plugin(contribution)
  await act(async () => { await plugin })
  // Two More buttons exist: the global panel menu and the account launcher this page is opened from.
  const launcher = document.querySelector<HTMLButtonElement>('button[data-signed-out]')
  if (launcher === null) throw new Error('account launcher missing')
  // The launcher opens the page itself; its row then becomes the way back.
  await act(async () => { fireEvent.click(launcher) })
  expect(c.ctx.layout.panelInfo.getSnapshot().activePanelId).toBe('settings')
  // The sidebar carries the section navigation while the page holds the column.
  expect(document.querySelector('[data-slot-error]')?.outerHTML ?? null).toBeNull()
  const sidebarNav = document.querySelector<HTMLElement>('ul[aria-label="Settings"]')!
  expect(within(sidebarNav).getByRole('button', { name: 'Custom' })).toBeTruthy()
  expect(within(sidebarNav).getByRole('button', { name: 'General' })).toBeTruthy()
  // Only the footer row offers the way back; the section list has no duplicate.
  expect(screen.getAllByRole('button', { name: 'Back to Workspace' })).toHaveLength(1)
  // The sidebar and the narrow-browser page rail both list the sections; the
  // slot-contributed glyphs belong to the page rail.
  const pageNav = screen.getByRole('navigation', { name: 'Settings' })
  const row = within(pageNav).getByRole('button', { name: 'Custom' })
  const icon = screen.getByTestId('section-icon')
  expect(row.contains(icon)).toBe(true)
  expect(row.querySelector('[data-slot="settings.section.icon"]')?.tagName).toBe('SPAN')
  expect(screen.getAllByTestId('section-icon')).toHaveLength(1)
  expect(icon.getAttribute('width')).toBe('16')
  expect(icon.getAttribute('data-active')).toBe('false')
  expect(row.textContent).toBe('Custom')
  const general = within(pageNav).getByRole('button', { name: 'General' })
  expect(general.querySelector('[data-slot="settings.section.icon"]')?.tagName).toBe('SPAN')
  const fallback = general.querySelector('svg')?.getAttribute('data-icon')
  expect(fallback).toBeTruthy()
  fireEvent.click(row)
  expect(icon.getAttribute('data-active')).toBe('true')
  expect(row.getAttribute('aria-current')).toBe('true')

  const replacement = c.ctx.plugin({
    name: 'test-settings-icon-replacement', inject: ['slots'],
    apply(ctx) {
      ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
        name: 'settings.section.icon', id: 'general',
      }, SectionIcon))
    },
  })
  await act(async () => { await replacement })
  expect(general.querySelector('[data-testid="section-icon"]')).not.toBeNull()
  await act(async () => { await replacement.dispose() })
  expect(general.querySelector('svg')?.getAttribute('data-icon')).toBe(fallback)
  await act(async () => { await plugin.dispose() })
  expect(screen.queryByRole('button', { name: 'Custom' })).toBeNull()
  expect(c.ctx.slots.entries('settings.section.icon')).toHaveLength(0)
}, 60_000)
