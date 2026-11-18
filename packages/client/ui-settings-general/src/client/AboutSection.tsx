/** About section: the build this client runs, with a copy action. */
import { useState } from 'react'
import { Toast, writeClipboard } from '@noharness/client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@noharness/client-ui-slots'
import css from './AboutSection.module.css'

/**
 * Compose the build label from the metadata the client build fixes in.
 * @returns Version, commit and dirty marker, or the version alone when only it is available.
 */
function buildLabel(): string | undefined {
  const version = process.env.NHS_CLIENT_VERSION
  if (version === undefined) return undefined
  const commit = process.env.NHS_CLIENT_COMMIT_HASH
  return version
    + (commit === undefined ? '' : `-${commit}`)
    + (process.env.NHS_CLIENT_GIT_DIRTY === 'true' ? '-dirty' : '')
}

/**
 * Render the About section: the running build and a copy control.
 * @param props - section owner share and localized copy.
 * @returns the About section element tree.
 */
export function AboutSection({ t }: PropsRuntime<'settings.section'> & PropsLocale<'settings'>) {
  const build = buildLabel()
  const [copied, setCopied] = useState(0)
  return (
    <section className={css.section} aria-label={t('about.nav')}>
      <div className={css.row}>
        <span className={css.label}>{t('about.version')}</span>
        <span className={css.valueGroup}>
          <code className={css.value}>{build ?? t('about.unavailable')}</code>
          {build !== undefined && (
            <button type="button" className={css.copy} onClick={() => {
              void writeClipboard(build).then((ok) => { if (ok) setCopied(sequence => sequence + 1) })
            }}>{t('about.copy')}</button>
          )}
        </span>
      </div>
      {copied > 0 && <Toast key={copied} tone="success" text={t('about.copied')} onDone={() => { setCopied(0) }} />}
    </section>
  )
}
