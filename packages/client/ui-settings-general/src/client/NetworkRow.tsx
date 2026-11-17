/** General Settings control for LAN access to the local Host. */
import { Switch } from '@noharness/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@noharness/client-ui-slots'
import type { DesktopNetworkSource } from './desktop-network-source.ts'
import css from './DeveloperToolsRow.module.css'

/** Observed exposure and its single writer. */
export interface NetworkRowInjected {
  hooks: { network: DesktopNetworkSource['store'] }
  setEnabled(enabled: boolean): Promise<void>
}

/**
 * Render the LAN exposure toggle with the address to share and any failure.
 * @param props - Observed exposure, writer and localized copy.
 * @returns The General Settings row.
 */
export function NetworkRow({ useNetwork, setEnabled, t }:
  PropsRuntime<'settings.general.item'> & PropsLocale<'settings'> & InjectFace<NetworkRowInjected>) {
  const { enabled, url, failed, pending } = useNetwork(value => value)
  return <div className={css.row}>
    <div>
      <div className={css.title}>{t('network.title')}</div>
      <div className={css.description}>{t('network.description')}</div>
      {url !== undefined && <div className={css.description}>{t('network.address', { url })}</div>}
      {failed && <div role="alert">{t('network.error')}</div>}
    </div>
    <Switch checked={enabled} disabled={pending} label={t('network.title')}
      onChange={(next) => { void setEnabled(next) }} />
  </div>
}
