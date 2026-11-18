/** The agent loop's settings page: how many tool calls one step may run at once. */

import type {} from '@noharness/client-ui-plugin-manager/client'
import { SettingsForm, SettingsPresetRow, SettingsValueField } from '@noharness/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@noharness/client-ui-slots'
import { formLabels } from './locales.ts'
import type { AgentLoopCardFace } from './agent-loop-card-controller.ts'

/** Props the renderer binds for the agent-loop page. */
export type AgentLoopCardProps =
  PropsRuntime<'plugins.item'>
  & PropsLocale<'settings.agentLoop'>
  & InjectFace<AgentLoopCardFace>

/**
 * Render the agent loop's one-liner or its settings form, as the Plugins page asks.
 * @param props - the view asked for, locale copy, the form snapshot, and its actions.
 * @returns the one-liner, or the form.
 */
export function AgentLoopCard(props: AgentLoopCardProps) {
  const { t } = props
  const state = props.useAgentLoopCard(snapshot => snapshot)
  if (props.view === 'summary') return t('description')
  return (
    <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
      <SettingsValueField
        id="plugin-config-agent-loop-parallel"
        label={t('maxParallel')}
        hint={t('maxParallelHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        numeric
        disabled={!state.writable}
        {...state.maxParallelToolCalls}
        onEdit={(text) => { props.edit('maxParallelToolCalls', text) }}
        onReset={() => { props.resetField('maxParallelToolCalls') }}
      />
      <SettingsPresetRow
        label={t('presets')}
        options={[
          { label: '1', value: '1' }, { label: '4', value: '4' }, { label: '8', value: '8' },
        ]}
        active={state.maxParallelToolCalls.text}
        disabled={!state.writable}
        onPick={(value) => { props.edit('maxParallelToolCalls', value) }}
      />
    </SettingsForm>
  )
}

/** Settings section for this page: the card's full form view. */
export function AgentLoopSettingsSection(props:
PropsRuntime<'settings.section'> & PropsLocale<'settings.agentLoop'> & InjectFace<AgentLoopCardFace>) {
  return <AgentLoopCard {...props} view="page" />
}
