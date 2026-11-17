/**
 * Settings shell root: the sidebar-foot trigger row, plus the settings page
 * that fills the frame's center column while it is open. The sidebar stays, so
 * leaving a setting is one click on New Session or a Session. Browsers below
 * 768px turn the section rail into a horizontal strip; Windows and macOS
 * desktop windows retain the rail (SettingsRoot.module.css). The shell is a
 * pure composition face - slot-owned text (trigger label, page title, close
 * label, sections) arrives from registrants through slots; accessible names
 * resolve from localized content (trigger: shell locale; page heading:
 * aria-labelledby the title node; close: visually-hidden slot text). Open state
 * and the active section id belong to the declared owner store; the panel
 * selection belongs to ui-layout. The onboarding coordinator mounts exactly one
 * ordered registrant while the sessions-derived empty-Hero fact is active.
 * Visible page chrome belongs to the step, so a mounted-but-deciding step paints
 * nothing here.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ConnectionIndicator, Tooltip } from '@noharness/client-ui-primitives'
import type { ConnectionIndicatorState } from '@noharness/client-ui-primitives'
import type { SettingsRootComponentProps } from './shell-contract.ts'
import css from './SettingsRoot.module.css'
import { DesktopUpdateIndicator } from './DesktopUpdateIndicator.tsx'
import { SETTINGS_PANEL_ID } from './SettingsPage.tsx'

const RECOVERY_CONFIRMATION_MS = 2_000

/** Minimum visible time for the connecting pill; shorter attempts read as flicker. */
const CONNECTING_MIN_VISIBLE_MS = 800

/**
 * Render the settings trigger and page.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the settings shell element tree.
 */
export function SettingsRoot(props: SettingsRootComponentProps) {
  const {
    wide, reconnect, useConnectionState, useSections, useOnboardingSteps, useSessions, renderSlot, t,
    useDesktopUpdate, openDesktopUpdate, useShortcuts, usePanelInfo, openSettings, showSettingsPage,
  } = props
  const shortcut = useShortcuts(rows => rows.find(row => row.id === 'settings.open'))
  // The page is a center-column panel, so the sidebar entry the trigger sits in
  // stays put and any Session is one click away. Leaving it by any route
  // (panel switch included) is what closing the page means.
  const pageOpen = usePanelInfo(info => info.activePanelId === SETTINGS_PANEL_ID)
  const [requestedOnboarding, setRequestedOnboarding] = useState<string | undefined>()
  const [completedOnboarding, setCompletedOnboarding] = useState<ReadonlySet<string>>(() => new Set())
  const [showRecovery, setShowRecovery] = useState(false)
  const [holdConnecting, setHoldConnecting] = useState(false)
  const connectingShownAt = useRef<number | undefined>(undefined)

  // The ledger tick keeps the nav rows fresh: registrants re-register with
  // freshly localized text on locale change, and the trigger/header/close
  // seats re-render through their own outlets' subscriptions.
  useSections(s => s)
  const desktopUpdate = useDesktopUpdate(state => state)
  const connectionState = useConnectionState(state => state)
  const previousConnectionState = useRef(connectionState)
  const onboardingSteps = useOnboardingSteps(s => s)
  const onboardingActive = useSessions((state) => {
    const main = Object.values(state.byId)
      .find(session => (session.retainedBy.mainView ?? 0) > 0)
    return state.phase === 'ready' && (main === undefined || main.blank)
  })
  // A step only owns the viewport when one is available to mount; a mounted
  // section stays put otherwise.
  const nextOnboardingStep = requestedOnboarding !== undefined
    ? onboardingSteps.find(step => step.id === requestedOnboarding)
    : onboardingActive
      ? onboardingSteps.find(step => !completedOnboarding.has(step.id))
      : undefined
  const onboardingStep = onboardingSteps.length === 0 ? undefined : nextOnboardingStep

  useEffect(() => {
    if (onboardingActive) return
    setCompletedOnboarding(new Set())
  }, [onboardingActive])

  const onboardingStepSeen = useRef(onboardingStep)
  // An onboarding step owns the viewport. A step that appears while the page is
  // open leaves it, rather than painting over a page that still holds focus.
  useEffect(() => {
    const appeared = onboardingStepSeen.current === undefined && onboardingStep !== undefined
    onboardingStepSeen.current = onboardingStep
    if (appeared && pageOpen) openSettings()
  }, [onboardingStep, openSettings, pageOpen])

  useLayoutEffect(() => {
    const previous = previousConnectionState.current
    previousConnectionState.current = connectionState
    if (connectionState !== 'connected') {
      setShowRecovery(false)
      return
    }
    if (previous !== 'disconnected' && previous !== 'connecting') return
    setShowRecovery(true)
  }, [connectionState])

  // The confirmation window starts when the recovered pill becomes visible,
  // which the connecting minimum-visible hold can delay past the transition.
  useLayoutEffect(() => {
    if (!showRecovery || holdConnecting) return
    const timeout = window.setTimeout(() => { setShowRecovery(false) }, RECOVERY_CONFIRMATION_MS)
    return () => { window.clearTimeout(timeout) }
  }, [showRecovery, holdConnecting])

  useLayoutEffect(() => {
    if (connectionState === 'connecting') {
      connectingShownAt.current = Date.now()
      return
    }
    const shownAt = connectingShownAt.current
    if (shownAt === undefined) return
    connectingShownAt.current = undefined
    const remaining = CONNECTING_MIN_VISIBLE_MS - (Date.now() - shownAt)
    if (remaining <= 0) return
    setHoldConnecting(true)
    const timeout = window.setTimeout(() => { setHoldConnecting(false) }, remaining)
    return () => {
      window.clearTimeout(timeout)
      setHoldConnecting(false)
    }
  }, [connectionState])

  const completeOnboardingStep = useCallback((id: string) => {
    setRequestedOnboarding(undefined)
    setCompletedOnboarding((previous) => {
      if (previous.has(id)) return previous
      return new Set([...previous, id])
    })
  }, [])

  let connectionIndicator: ConnectionIndicatorState | undefined
  if (connectionState === 'connecting' || holdConnecting) {
    connectionIndicator = 'connecting'
  } else if (connectionState === 'disconnected') {
    connectionIndicator = 'disconnected'
  } else if (showRecovery) {
    connectionIndicator = 'recovered'
  }

  return (
    <>
      <div className={clsx(css.triggerRow, !wide && css.railRow)}>
        {renderSlot('settings.launcher', {
          wide, settingsOpen: pageOpen, openSettings: (sectionId) => {
            if (sectionId === undefined) showSettingsPage()
            else openSettings(sectionId)
          },
          ...(shortcut?.keys.length ? { settingsShortcut: { keys: shortcut.keys, aria: shortcut.aria } } : {}),
          openOnboarding: (id) => { showSettingsPage(); setRequestedOnboarding(id) },
        }, { fallback: <Tooltip disabled={pageOpen} label={t('trigger')} shortcutKeys={shortcut?.keys}>
          <button
            type="button"
            className={clsx(css.trigger, !wide && css.rail)}
            aria-label={t('trigger')}
            aria-keyshortcuts={shortcut?.aria}
            aria-expanded={pageOpen}
            onClick={() => { showSettingsPage() }}
          >
            {renderSlot('settings.trigger', { wide })}
          </button>
        </Tooltip> })}
        <ConnectionIndicator
          state={wide && desktopUpdate.presentation?.phase !== 'installing' ? connectionIndicator : undefined}
          disconnectedLabel={t('connection.error')}
          connectingLabel={t('connection.connecting')}
          recoveredLabel={t('connection.connected')}
          reconnectActionLabel={t('connection.reconnect')}
          restartActionLabel={t('connection.restart')}
          onReconnect={reconnect}
        />
        <DesktopUpdateIndicator wide={wide} hidden={connectionIndicator !== undefined && desktopUpdate.presentation?.phase !== 'installing'}
          t={t} view={desktopUpdate} onOpen={openDesktopUpdate} />
      </div>
      {/* Dialog chrome and `#root` inert ownership live inside each step's
          visible branch. A step still deciding (private facts loading)
          renders null, so nothing paints or blocks while it decides. */}
      {onboardingStep !== undefined && renderSlot('settings.onboarding', {
        stepId: onboardingStep.id,
        explicit: requestedOnboarding !== undefined,
        complete: () => { completeOnboardingStep(onboardingStep.id) },
        openSection: (sectionId) => { openSettings(sectionId) },
      }, { only: onboardingStep.id })}
    </>
  )
}
