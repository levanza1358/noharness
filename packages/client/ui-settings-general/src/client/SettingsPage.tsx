/**
 * Settings page registered into the frame's `main` slot, browser half: the page
 * becomes a center-column panel selected through ui-layout, and closing it
 * (panel switch, close button, or Escape) returns the center column to the
 * Conversation. The page renders the settings shell's own section, header, and
 * action seats, so those registrations and the page live under one fiber and
 * one store. Export discipline: packages/client/AGENTS.md.
 */
import { useEffect, useId, useRef } from 'react'
import clsx from 'clsx'
import { IconCloseOutlineRegular } from '@noharness/client-ui-primitives'
import type {} from '@noharness/client-ui-layout/client'
import type { MainPanelId } from '@noharness/client-ui-layout/client'
import type {} from '@noharness/client-ui-renderer/client'
// Type-only: pulls the settings shell slot declarations.
import type {} from '@noharness/client-ui-settings/client'
import type { InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime, PropsStore } from '@noharness/client-ui-slots'
import type { SettingsPageInjected } from './shell-contract.ts'
import type { createSettingsShellStore } from './shell-store.ts'
import { sectionIcon } from './section-icon.tsx'
import css from './SettingsRoot.module.css'

/** Center-column key this page occupies; every other key shows the Conversation. */
export const SETTINGS_PANEL_ID = 'settings' as MainPanelId

/**
 * Center-column occupant props: the runtime seats, the page's own slot seats,
 * the declared shell store, and the page's injected select and close paths.
 */
export type SettingsPageComponentProps =
  PropsRuntime<'main'>
  & PropsRenderSlots<
    | 'settings.header'
    | 'settings.action'
    | 'settings.close'
    | 'settings.section'
    | 'settings.section.icon'
  >
  & PropsStore<ReturnType<typeof createSettingsShellStore>>
  & PropsLocale<'settings'>
  & InjectFace<SettingsPageInjected>

/**
 * Render the settings page that occupies the frame's center column: heading,
 * section rail, and the active section. Close paths: the header button and
 * document-level Escape (mounted only while the page occupies the column, so
 * the listener lifetime is the page's).
 * @param props - the shell shares plus the page's select and close callbacks.
 * @returns the page element tree.
 */
export function SettingsPage({ useSections, renderSlot, useStore, select, close, t }: SettingsPageComponentProps) {
  const { activeId } = useStore(state => state)
  const rows = useSections(s => s)
  // Entries can unmount underneath the requested id, so the render-time
  // projection falls back to the first row when the id is gone.
  const active = rows.find(r => r.id === activeId)?.id ?? rows[0]?.id
  const titleId = useId()
  const page = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !event.defaultPrevented) close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown) }
  }, [close])

  return (
    <div ref={page} tabIndex={-1} data-shortcut-modal="settings" className={css.panel} role="region" aria-labelledby={titleId}>
      {/* The four seats stay direct children of the page and take their
          places from its grid: title and header share the first row, the
          navigation and the active section the second. */}
      <div className={css.navTitle} id={titleId} tabIndex={-1} data-modal-autofocus="">{renderSlot('settings.header', {})}</div>
      <nav className={css.nav} aria-label={t('trigger')}>
        <div className={css.navList}>
          {rows.map(row => (
            <button
              key={row.id}
              type="button"
              className={clsx(css.navCell, row.id === active && css.active)}
              aria-current={row.id === active ? 'true' : undefined}
              data-modal-autofocus={row.id === active ? '' : undefined}
              onFocus={(event) => { event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }}
              onClick={() => { select(row.id) }}
            >
              <span className={css.navIcon} aria-hidden="true">
                {renderSlot('settings.section.icon', { size: 16, active: row.id === active }, {
                  only: row.id, fallback: sectionIcon(row.id),
                })}
              </span>
              <span className={css.navLabel}>{row.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className={css.header}>
        <div className={css.actions}>{renderSlot('settings.action', {})}</div>
        <button type="button" className={css.close} onClick={close}>
          <IconCloseOutlineRegular size={14} />
          <span className={css.hiddenLabel}>{renderSlot('settings.close', {})}</span>
        </button>
      </div>
      <div className={css.options}>
        {active !== undefined && renderSlot('settings.section', { close }, { only: active })}
      </div>
    </div>
  )
}
