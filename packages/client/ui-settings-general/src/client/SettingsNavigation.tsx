/** Settings section navigation shown in the sidebar while the settings page holds the center column. */
import { useState } from 'react'
import clsx from 'clsx'
import type { PropsLocale, PropsRuntime, PropsStore } from '@noharness/client-ui-slots'
import type { createSettingsShellStore } from './shell-store.ts'
import { sectionIcon } from './section-icon.tsx'
import css from './SettingsNavigation.module.css'

/** Sidebar column state, the shell store shared with the page, and the return path the sidebar supplies. */
export type SettingsNavigationProps =
  PropsRuntime<'sidebar.settings.navigation'>
  & PropsLocale<'settings'>
  & PropsStore<ReturnType<typeof createSettingsShellStore>>

/**
 * Render the settings sections in the sidebar's browsing region, with the row
 * that returns to the Workspace pinned below them.
 * @param props - sidebar column state, the shared shell store, and its actions.
 * @returns the navigation element tree.
 */
export function SettingsNavigation({ wide, useStore, actions, t }: SettingsNavigationProps) {
  const activeId = useStore(state => state.activeId)
  const rows = useStore(state => state.rows)
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const visible = needle === '' ? rows : rows.filter(row => row.label.toLowerCase().includes(needle))
  // Entries can unmount underneath the requested id, so the projection falls
  // back to the first row the way the page does.
  const active = rows.find(row => row.id === activeId)?.id ?? rows[0]?.id
  return (
    <div className={css.root}>
      {wide && <input type="search" className={css.search} value={query} aria-label={t('search.label')}
        placeholder={t('search.placeholder')} onChange={(event) => { setQuery(event.currentTarget.value) }} />}
      {visible.length === 0
        ? <p className={css.empty} role="status">{t('search.empty')}</p>
        : null}
      <ul className={css.list} aria-label={t('trigger')}>
        {visible.map(row => (
          <li key={row.id}>
            <button type="button" className={clsx(css.row, row.id === active && css.active)}
              aria-current={row.id === active ? 'true' : undefined}
              onClick={() => { actions.select(row.id) }}>
              <span className={css.icon} aria-hidden="true">{sectionIcon(row.id)}</span>
              {wide && <span className={css.label}>{row.label}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
