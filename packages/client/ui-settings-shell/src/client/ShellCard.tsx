/** The shell executor's settings page: the limits every command the agent runs is bound by. */

import type {} from '@noharness/client-ui-plugin-manager/client'
import { SettingsForm, SettingsPresetRow, SettingsValueField } from '@noharness/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@noharness/client-ui-slots'
import { formLabels } from './locales.ts'
import type { ShellCardFace } from './shell-card-controller.ts'

/** Props the renderer binds for the shell page. */
export type ShellCardProps =
  PropsRuntime<'plugins.item'>
  & PropsLocale<'settings.shell'>
  & InjectFace<ShellCardFace>

/**
 * Render the shell executor's one-liner or its settings form, as the Plugins page asks.
 * @param props - the view asked for, locale copy, the form snapshot, and its actions.
 * @returns the one-liner, or the form.
 */
export function ShellCard(props: ShellCardProps) {
  const { t } = props
  const state = props.useShellCard(snapshot => snapshot)
  if (props.view === 'summary') return t('description')
  const disabled = !state.writable
  return (
    <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
      <SettingsValueField
        id="plugin-config-shell-timeout"
        label={t('timeoutMs')}
        hint={t('timeoutMsHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        numeric
        disabled={disabled}
        {...state.timeoutMs}
        onEdit={(text) => { props.edit('timeoutMs', text) }}
        onReset={() => { props.resetField('timeoutMs') }}
      />
      <SettingsPresetRow
        label={t('timeoutPresets')}
        options={[60, 120, 300].map(seconds => ({
          label: t('presetSeconds', { seconds: String(seconds) }),
          value: String(seconds * 1000),
        }))}
        active={state.timeoutMs.text}
        disabled={disabled}
        onPick={(value) => { props.edit('timeoutMs', value) }}
      />
      <SettingsValueField
        id="plugin-config-shell-output"
        label={t('maxOutputBytes')}
        hint={t('maxOutputBytesHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        numeric
        disabled={disabled}
        {...state.maxOutputBytes}
        onEdit={(text) => { props.edit('maxOutputBytes', text) }}
        onReset={() => { props.resetField('maxOutputBytes') }}
      />
      <SettingsPresetRow
        label={t('outputPresets')}
        options={[
          { label: t('presetKb', { kilobytes: '30' }), value: '30000' },
          { label: t('presetKb', { kilobytes: '100' }), value: '100000' },
          { label: t('presetMb', { megabytes: '1' }), value: '1000000' },
        ]}
        active={state.maxOutputBytes.text}
        disabled={disabled}
        onPick={(value) => { props.edit('maxOutputBytes', value) }}
      />
    </SettingsForm>
  )
}

/** Settings section for this page: the card's full form view. */
export function ShellSettingsSection(props:
PropsRuntime<'settings.section'> & PropsLocale<'settings.shell'> & InjectFace<ShellCardFace>) {
  return <ShellCard {...props} view="page" />
}
