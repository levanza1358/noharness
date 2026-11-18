/**
 * One plugin's settings form as its page on the Plugins page shows it: the
 * read-only notice when the deployment stores settings read-only, the
 * plugin's controls, and the save that writes every staged edit. The page
 * draws the plugin's title and one-liner itself.
 *
 * Only a save writes. Leaving the page drops every staged edit, so the form
 * discards on unmount and offers no discard control. A form whose namespace
 * the Host stopped serving says so in place of its controls rather than
 * showing fields nothing would accept.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import type { SettingsFormShell } from './form-model.ts'
import css from './SettingsForm.module.css'

/** The copy the form frame renders, from the owning plugin's dictionary. */
export interface SettingsFormLabels {
  /** Shown in place of the controls while the namespace is not served. */
  unavailable: string
  /** Shown over the controls while the document is read-only. */
  readOnly: string
  /** Shown beside the save after a save the Host did not accept. */
  saveFailed: string
  /** The save control. */
  save: string
  /** The save control while a save is crossing the wire. */
  saving: string
  /** Shown beside the save while staged edits wait to be written; omitted forms show no notice. */
  unsaved?: string
}

/** Form chrome shared by every settings page. */
export interface SettingsFormProps {
  /** The frame's copy. */
  labels: SettingsFormLabels
  /** The form state: availability, writability, and what a save would do. */
  state: SettingsFormShell
  /** Write every staged edit. */
  onSave: () => void
  /** Drop every staged edit; the form calls it when it leaves the page. */
  onDiscard: () => void
  /** The plugin's controls. */
  children: ReactNode
}

/** Dirty forms currently mounted; Ctrl/Cmd+S saves every one of them. */
const dirtyForms = new Set<() => void>()

/** @param event - document keydown while at least one dirty form is mounted. */
function saveOnShortcut(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
  if (event.key.toLowerCase() !== 's') return
  event.preventDefault()
  for (const save of [...dirtyForms]) save()
}

/**
 * Keep staged edits from disappearing without a trace on reload or close.
 * @param event - the browser's unload confirmation.
 */
function warnOnUnload(event: BeforeUnloadEvent): void {
  event.preventDefault()
}

/** One preset a settings field offers beside its input. */
export interface SettingsPresetOption {
  /** Visible label. */
  readonly label: string
  /** Draft text the option stages. */
  readonly value: string
}

/**
 * Render quick choices that stage one field's draft.
 * @param props - the group label, its options, the current draft, and the pick handler.
 * @returns the preset row.
 */
export function SettingsPresetRow({ label, options, active, disabled, onPick }: {
  readonly label: string
  readonly options: readonly SettingsPresetOption[]
  readonly active: string
  readonly disabled: boolean
  readonly onPick: (value: string) => void
}) {
  return (
    <div className={css.presets} role="group" aria-label={label}>
      {options.map(option => (
        <button key={option.value} type="button" className={css.preset}
          data-active={option.value === active ? 'true' : undefined}
          disabled={disabled}
          onClick={() => { onPick(option.value) }}>
          {option.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Render one plugin's settings form.
 * @param props - the form's copy and state, its controls, and the save and discard actions.
 * @returns the form, or the unavailable line while the namespace is not served.
 */
export function SettingsForm(props: SettingsFormProps) {
  const { state, labels } = props
  const discard = useRef(props.onDiscard)
  discard.current = props.onDiscard
  useEffect(() => () => { discard.current() }, [])
  const save = useRef(props.onSave)
  save.current = props.onSave
  const savable = state.available && state.writable && state.dirty && !state.invalid && !state.saving
  useEffect(() => {
    if (!savable) return
    const shortcut = (): void => { save.current() }
    dirtyForms.add(shortcut)
    if (dirtyForms.size === 1) document.addEventListener('keydown', saveOnShortcut)
    return () => {
      dirtyForms.delete(shortcut)
      if (dirtyForms.size === 0) document.removeEventListener('keydown', saveOnShortcut)
    }
  }, [savable])
  useEffect(() => {
    if (!state.dirty) return
    window.addEventListener('beforeunload', warnOnUnload)
    return () => { window.removeEventListener('beforeunload', warnOnUnload) }
  }, [state.dirty])
  if (!state.available) return <p className={css.unavailable} role="status">{labels.unavailable}</p>
  const blocked = !state.dirty || state.invalid || state.saving
  return (
    <div className={css.form}>
      {!state.writable ? <p className={css.readOnly} role="status">{labels.readOnly}</p> : null}
      {props.children}
      <div className={css.footer}>
        {state.failed ? <p className={css.failed} role="status">{labels.saveFailed}</p> : null}
        {state.dirty && !state.saving && labels.unsaved !== undefined
          ? <p className={css.unsaved} role="status">{labels.unsaved}</p>
          : null}
        <button
          type="button"
          className={css.save}
          disabled={blocked}
          aria-keyshortcuts="Control+S Meta+S"
          onClick={props.onSave}
        >
          {state.saving ? labels.saving : labels.save}
        </button>
      </div>
    </div>
  )
}
