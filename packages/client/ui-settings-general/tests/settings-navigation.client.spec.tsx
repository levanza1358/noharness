// @vitest-environment jsdom
/** Settings navigation shown in the sidebar's browsing region. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { SettingsSectionRow } from '../src/client/shell-contract.ts'
import { SettingsNavigation, type SettingsNavigationProps } from '../src/client/SettingsNavigation.tsx'
import { en, type SettingsKey } from '../src/client/locales.ts'

afterEach(cleanup)

const rows: readonly SettingsSectionRow[] = [
  { id: 'general', order: 0, label: 'General' },
  { id: 'account', order: 1, label: 'Account' },
  { id: 'models', order: 2, label: 'Models' },
  { id: 'providers', order: 3, label: 'Providers' },
  { id: 'plugins', order: 4, label: 'Built-in plugins' },
  { id: 'agent-presets', order: 5, label: 'Agent presets' },
  { id: 'archived-sessions', order: 6, label: 'Archived sessions' },
]

function mount({ wide = true, activeId }: { wide?: boolean; activeId?: string } = {}) {
  const select = vi.fn()
  const props = {
    wide,
    useStore: <T,>(selector: (value: { activeId: string | undefined; rows: readonly SettingsSectionRow[] }) => T) =>
      selector({ activeId, rows }),
    actions: { select, openSection: vi.fn(), setRows: vi.fn() },
    t: (key: string) => en[key as SettingsKey],
  } as unknown as SettingsNavigationProps
  render(<SettingsNavigation {...props} />)
  return { select }
}

it('lists every section and marks the active row', () => {
  const { select } = mount({ activeId: 'models' })
  const list = screen.getByRole('list', { name: en.trigger })
  const buttons = screen.getAllByRole('button')
  expect(buttons.map(button => button.textContent)).toEqual([
    'General', 'Account', 'Models', 'Providers', 'Built-in plugins', 'Agent presets', 'Archived sessions',
  ])
  expect(list.contains(buttons[0]!)).toBe(true)
  expect(buttons[2]!.getAttribute('aria-current')).toBe('true')
  expect(buttons[0]!.getAttribute('aria-current')).toBeNull()
  // Each row carries its section glyph rather than text-only chrome.
  expect(buttons[5]!.querySelector('svg')?.getAttribute('data-icon')).toBe('dsw-icon-agent-preset-outline-medium')
  fireEvent.click(buttons[3]!)
  expect(select).toHaveBeenCalledExactlyOnceWith('providers')
})

it('falls back to the first section when the stored id no longer exists', () => {
  mount({ activeId: 'removed' })
  expect(screen.getAllByRole('button')[0]!.getAttribute('aria-current')).toBe('true')
})

it('shows glyph-only rows in the collapsed rail', () => {
  const { select } = mount({ wide: false, activeId: 'general' })
  const buttons = screen.getAllByRole('button')
  expect(buttons.map(button => button.textContent)).toEqual(['', '', '', '', '', '', ''])
  expect(buttons[0]!.querySelector('svg')).not.toBeNull()
  fireEvent.click(buttons[1]!)
  expect(select).toHaveBeenCalledExactlyOnceWith('account')
})

it('filters the section list from the search field', () => {
  mount({ activeId: 'general' })
  const search = screen.getByRole('searchbox', { name: en['search.label'] })
  fireEvent.change(search, { target: { value: 'prov' } })
  expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual(['Providers'])
  fireEvent.change(search, { target: { value: 'zzz' } })
  expect(screen.queryAllByRole('button')).toEqual([])
  expect(screen.getByRole('status').textContent).toBe(en['search.empty'])
  fireEvent.change(search, { target: { value: '' } })
  expect(screen.getAllByRole('button')).toHaveLength(7)
})

it('shows no search field in the collapsed rail', () => {
  mount({ wide: false })
  expect(screen.queryByRole('searchbox')).toBeNull()
})
