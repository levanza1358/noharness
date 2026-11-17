/** General Settings control for the Windows tray icon. */
import { Switch } from '@noharness/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@noharness/client-ui-slots'
import type { DesktopTraySource } from './desktop-tray-source.ts'
import css from './DeveloperToolsRow.module.css'

/** Observed shell preference and its single writer. */
export interface TrayRowInjected {
  hooks: { tray: DesktopTraySource['store'] }
  setEnabled(enabled: boolean): Promise<void>
}

/**
 * Render the tray toggle with the failure it could not report elsewhere.
 * @param props - Observed preference, writer and localized copy.
 * @returns The General Settings row.
 */
export function TrayRow({ useTray, setEnabled, t }:
  PropsRuntime<'settings.general.item'> & PropsLocale<'settings'> & InjectFace<TrayRowInjected>) {
  const { enabled, failed, pending } = useTray(value => value)
  return <div className={css.row}>
    <div>
      <div className={css.title}>{t('tray.title')}</div>
      <div className={css.description}>{t('tray.description')}</div>
      {failed && <div role="alert">{t('tray.error')}</div>}
    </div>
    <Switch checked={enabled} disabled={pending} label={t('tray.title')}
      onChange={(next) => { void setEnabled(next) }} />
  </div>
}
