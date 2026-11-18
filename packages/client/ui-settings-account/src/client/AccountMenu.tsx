/** Sidebar settings launcher and the account identity it renders. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Toast, IconChevronLeftOutlineRegular, IconSettingsOutlineMedium } from '@noharness/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime, PropsRenderSlots } from '@noharness/client-ui-slots'
import type { AccountSectionInjected } from './AccountSection.tsx'
import { SignInDialog } from './SignInDialog.tsx'
import { AccountAvatar } from './AccountAvatar.tsx'
import type {} from './account-ui.ts'
import css from './AccountMenu.module.css'

/** Settings launcher composed by the settings shell. */
export type AccountMenuProps = PropsRuntime<'settings.launcher'> & PropsRenderSlots<'settings.launcher.notifications'> & PropsLocale<'settings.account'> & InjectFace<AccountSectionInjected>

/** The signed-in label stays empty while the profile loads.
 * @param props - sidebar geometry, settings navigation and account snapshot.
 * @returns the launcher that opens Settings, plus the model sign-in dialog.
 */
export function AccountMenu({
  subscribeSessionExpired, subscribeModelSignInRequired, wide, openSettings, closeSettings, settingsOpen,
  useAccount, useTheme, refreshAccount, renderSlot,
  showLogin, start, cancel, avatarFailed, t,
}: AccountMenuProps) {
  // The launcher outlives the panel, so a false-to-true edge is one Settings entry:
  // re-renders, section switches and tab switches inside one open must not read again.
  const settingsWasOpen = useRef(false)
  useEffect(() => {
    if (settingsOpen && !settingsWasOpen.current) void refreshAccount()
    settingsWasOpen.current = settingsOpen
  }, [refreshAccount, settingsOpen])
  const account = useAccount(state => state)
  const colorScheme = useTheme(snapshot => snapshot.active.colorScheme)
  const signedIn = account.view?.status === 'credential-stored'
  const [signInNotice, setSignInNotice] = useState(0)
  useEffect(() => subscribeModelSignInRequired?.(() => { setSignInNotice(value => value + 1) }), [subscribeModelSignInRequired])
  const [expiryNotice, setExpiryNotice] = useState(false)
  useEffect(() => subscribeSessionExpired?.(() => { setExpiryNotice(true) }), [subscribeSessionExpired])
  const profile = account.details?.profile
  const label = profile === undefined ? null : profile.status === 'ready'
    ? profile.value.name ?? profile.value.contact ?? t('signedIn') : t('signedIn')
  const openAccount = useCallback(() => { openSettings('account') }, [openSettings])
  return <div className={css.root} data-inset={signedIn && wide}>
    {signInNotice > 0 && <Toast key={signInNotice} text={t('modelSignInRequired')} onDone={() => { setSignInNotice(0) }} />}
    {expiryNotice && <Toast text={t('sessionExpired')} onDone={() => { setExpiryNotice(false) }} />}
    <div className={css.notifications} hidden={!wide}>{renderSlot('settings.launcher.notifications', {
      active: signedIn && !account.desktopOnboardingVisible, openAccount,
    })}</div>
    <button type="button" className={css.trigger} data-collapsed={!wide} data-signed-out={!signedIn}
      aria-label={wide ? undefined : t(settingsOpen ? 'backToWorkspace' : 'settings')}
      onClick={() => { if (settingsOpen) closeSettings(); else openSettings() }}>
      {settingsOpen
        ? <IconChevronLeftOutlineRegular size={16} />
        : signedIn
          ? <span className={css.avatar} data-avatar-status={account.avatar?.status}>
            <AccountAvatar avatar={account.avatar} avatarFailed={avatarFailed} />
          </span>
          : <IconSettingsOutlineMedium size={16} />}
      {wide && <span className={css.label}>{settingsOpen ? t('backToWorkspace') : signedIn ? label : t('settings')}</span>}
    </button>
    {account.loginVisible && <SignInDialog account={account} colorScheme={colorScheme}
      start={start} cancel={cancel} t={t}
      close={() => { showLogin(false) }} useApiKey={() => { showLogin(false); openSettings('providers') }} />}
  </div>
}
