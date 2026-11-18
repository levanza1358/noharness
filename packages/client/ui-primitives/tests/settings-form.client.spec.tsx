// @vitest-environment jsdom
/** The settings form frame: what it says in each state, and that leaving it discards. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { SettingsForm } from '../src/settings-form/SettingsForm.tsx'
import type { SettingsFormShell } from '../src/settings-form/form-model.ts'

afterEach(cleanup)

const labels = {
  unavailable: 'Not loaded.',
  readOnly: 'Read-only.',
  saveFailed: 'Not accepted.',
  save: 'Save',
  saving: 'Saving…',
  unsaved: 'Unsaved changes',
}

const settled: SettingsFormShell = { available: true, writable: true, dirty: false, invalid: false, saving: false, failed: false }

function renderForm(state: Partial<SettingsFormShell> = {}) {
  const onSave = vi.fn()
  const onDiscard = vi.fn()
  render(
    <SettingsForm labels={labels} state={{ ...settled, ...state }} onSave={onSave} onDiscard={onDiscard}>
      <input aria-label="Field" />
    </SettingsForm>,
  )
  return { onSave, onDiscard }
}

it('says the namespace is not served in place of the controls', () => {
  renderForm({ available: false })

  expect(screen.getByRole('status').textContent).toBe(labels.unavailable)
  expect(screen.queryByLabelText('Field')).toBeNull()
})

it('keeps the save inert until something is staged, then saves on click', () => {
  const { onSave } = renderForm()
  expect(screen.getByRole('button', { name: labels.save })).toHaveProperty('disabled', true)
  cleanup()

  const dirty = renderForm({ dirty: true })
  fireEvent.click(screen.getByRole('button', { name: labels.save }))
  expect(dirty.onSave).toHaveBeenCalledOnce()
  expect(onSave).not.toHaveBeenCalled()
})

it('blocks the save while a draft is invalid or one is in flight, and reports a refused save', () => {
  renderForm({ dirty: true, invalid: true })
  expect(screen.getByRole('button', { name: labels.save })).toHaveProperty('disabled', true)
  cleanup()

  renderForm({ dirty: true, saving: true })
  expect(screen.getByRole('button', { name: labels.saving })).toHaveProperty('disabled', true)
  cleanup()

  renderForm({ dirty: true, failed: true })
  // The unsaved notice and the failure share the footer.
  expect(screen.getByText(labels.saveFailed)).toBeTruthy()
})

it('says the document is read-only over the controls', () => {
  renderForm({ writable: false })

  expect(screen.getByRole('status').textContent).toBe(labels.readOnly)
  expect(screen.getByLabelText('Field')).toBeTruthy()
})

it('discards when it leaves the page, calling the latest discard it was given', () => {
  const first = vi.fn()
  const second = vi.fn()
  const { rerender, unmount } = render(
    <SettingsForm labels={labels} state={settled} onSave={vi.fn()} onDiscard={first}><span /></SettingsForm>,
  )
  rerender(<SettingsForm labels={labels} state={settled} onSave={vi.fn()} onDiscard={second}><span /></SettingsForm>)

  unmount()

  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledOnce()
})

it('says staged edits are unsaved and saves them on Ctrl/Cmd+S', () => {
  const { onSave } = renderForm({ dirty: true })
  expect(screen.getByRole('status').textContent).toBe(labels.unsaved)
  fireEvent.keyDown(document, { key: 's', ctrlKey: true })
  expect(onSave).toHaveBeenCalledOnce()
  fireEvent.keyDown(document, { key: 's', metaKey: true })
  expect(onSave).toHaveBeenCalledTimes(2)
  // An unrelated chord is left to the browser.
  fireEvent.keyDown(document, { key: 's', ctrlKey: true, shiftKey: true })
  expect(onSave).toHaveBeenCalledTimes(2)
})

it('ignores the shortcut while the form cannot save', () => {
  const { onSave } = renderForm({ dirty: false })
  fireEvent.keyDown(document, { key: 's', ctrlKey: true })
  expect(onSave).not.toHaveBeenCalled()
})

it('asks before a reload or close drops staged edits', () => {
  const listener = vi.fn((event: Event) => { event.preventDefault() })
  window.addEventListener('beforeunload', listener, { once: true })
  renderForm({ dirty: true })
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(listener).toHaveBeenCalledOnce()
  expect(event.defaultPrevented).toBe(true)
})
