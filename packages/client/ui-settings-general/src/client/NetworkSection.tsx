/** Network settings section: LAN access to the local Host through the Desktop proxy. */
import { useEffect, useState } from 'react'
import { Button, Switch, Toast, writeClipboard } from '@noharness/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@noharness/client-ui-slots'
import type { DesktopNetworkSource } from './desktop-network-source.ts'
import type { DesktopNetworkExposureOptions } from '../types.ts'
import css from './NetworkSection.module.css'

/** Lowest port the settings accept; below this the OS privilege boundary applies. */
const MIN_PORT = 1024
/** Highest valid TCP port. */
const MAX_PORT = 65535

/** Observed exposure and its single writer. */
export interface NetworkSectionInjected {
  hooks: { network: DesktopNetworkSource['store'] }
  set(options: DesktopNetworkExposureOptions): Promise<void>
}

/**
 * Read a port field: empty asks for an automatic port, anything else must fall inside the accepted range.
 * @param draft - Field text.
 * @returns The chosen port (0 for automatic), or undefined when the text is not acceptable.
 */
function parsePort(draft: string): number | undefined {
  const text = draft.trim()
  if (text === '') return 0
  if (!/^\d+$/u.test(text)) return undefined
  const value = Number(text)
  return Number.isSafeInteger(value) && value >= MIN_PORT && value <= MAX_PORT ? value : undefined
}

/**
 * Render the Network section: the exposure switch, its port, and the address to share.
 * @param props - Observed exposure, writer and localized copy.
 * @returns The Network section element tree.
 */
export function NetworkSection({ useNetwork, set, t }:
  PropsRuntime<'settings.section'> & PropsLocale<'settings'> & InjectFace<NetworkSectionInjected>) {
  const { enabled, url, urls, failed, pending, port } = useNetwork(value => value)
  const [draft, setDraft] = useState(port === 0 ? '' : String(port))
  // A shell-side change (rollback, another window) is authoritative for the field.
  useEffect(() => { setDraft(port === 0 ? '' : String(port)) }, [port])
  const chosen = parsePort(draft)
  const [copied, setCopied] = useState(0)
  const portChanged = chosen !== undefined && chosen !== port
  return <section className={css.section} aria-label={t('network.nav')}>
    <div className={css.row}>
      <div className={css.copy}>
        <div className={css.title}>{t('network.title')}</div>
        <div className={css.description}>{t('network.description')}</div>
      </div>
      <Switch checked={enabled} disabled={pending} label={t('network.title')}
        onChange={(next) => {
          if (chosen === undefined) { setDraft(port === 0 ? '' : String(port)); return }
          void set({ enabled: next, port: chosen })
        }} />
    </div>
    <div className={css.row}>
      <label className={css.copy} htmlFor="nhs-network-port">
        <span className={css.title}>{t('network.port')}</span>
        <span className={css.description}>{t('network.portHint')}</span>
        {chosen === undefined && <span className={css.invalid} role="alert">{t('network.portInvalid')}</span>}
      </label>
      <span className={css.portGroup}>
        <input id="nhs-network-port" className={css.port} type="number" inputMode="numeric"
          min={MIN_PORT} max={MAX_PORT} placeholder={t('network.portAutomatic')} value={draft}
          aria-invalid={chosen === undefined} disabled={pending}
          onChange={(event) => { setDraft(event.currentTarget.value) }} />
        <Button variant="outline" disabled={pending || chosen === undefined || !portChanged}
          onClick={() => { if (chosen !== undefined) void set({ enabled, port: chosen }) }}>
          {t('network.apply')}
        </Button>
      </span>
    </div>
    {enabled && url !== undefined && <div className={css.row}>
      <div className={css.copy}>
        <div className={css.title}>{t('network.addressLabel')}</div>
        <div className={css.description}>{t('network.address', { url })}</div>
      </div>
      <Button variant="outline" onClick={() => {
        void writeClipboard(url).then((ok) => { if (ok) setCopied(sequence => sequence + 1) })
      }}>{t('network.copy')}</Button>
    </div>}
    {enabled && urls !== undefined && urls.length > 1 && <div className={css.row}>
      <div className={css.copy}>
        <div className={css.title}>{t('network.otherAddresses')}</div>
        {urls.slice(1).map(candidate => <div key={candidate} className={css.description}>{candidate}</div>)}
      </div>
    </div>}
    {failed && <div className={css.row}><span role="alert">{t('network.error')}</span></div>}
    {copied > 0 && <Toast key={copied} tone="success" text={t('network.copied')} onDone={() => { setCopied(0) }} />}
  </section>
}
