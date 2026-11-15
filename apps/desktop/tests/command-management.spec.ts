/** Locale-owned native command-management states. */

import { expect, it } from 'vitest'
import { en, ja } from '../src/locale.ts'
import { presentCommandManagement } from '../src/command-management.ts'

it.each([en, ja])('shows installation, repair/removal and shadowed command locations', (messages) => {
  const destination = '/usr/local/bin/nhs'
  const missing = presentCommandManagement({ managed: false, available: false, destination }, messages, 'darwin')
  expect(missing.buttons).toEqual([messages.cliCommandInstall, messages.cancel])
  expect(missing.cancelId).toBe(1)
  const installed = presentCommandManagement({ managed: true, available: true, destination, activeCommand: destination }, messages, 'darwin')
  expect(installed.buttons).toEqual([messages.cliCommandClose, messages.cliCommandRepair, messages.cliCommandRemove])
  expect(installed.cancelId).toBe(0)
  const shadowed = presentCommandManagement({ managed: true, available: true, destination, activeCommand: '/opt/homebrew/bin/nhs' }, messages, 'darwin')
  expect(shadowed.type).toBe('warning')
  expect(shadowed.detail).toContain('/opt/homebrew/bin/nhs')
  expect(shadowed.detail).toContain(messages.cliCommandShadowed)
  const unknown = presentCommandManagement({ managed: false, available: false, destination, selectionUnknown: true }, messages, 'darwin')
  expect(unknown.detail).toContain(messages.cliCommandSelectionUnknown)
})

it.each([
  ['darwin', 'en-US', en], ['darwin', 'ja-JP', ja],
  ['win32', 'en-US', en], ['win32', 'ja-JP', ja],
] as const)('records command status on %s in %s', async (platform, language, messages) => {
  const destination = platform === 'darwin' ? '/usr/local/bin/nhs' : 'C:\\Users\\user\\AppData\\Local\\Programs\\NoHarness\\resources\\runtime\\cli\\bin\\nhs.cmd'
  const other = platform === 'darwin' ? '/opt/homebrew/bin/nhs' : 'C:\\Program Files\\nodejs\\nhs.cmd'
  const states = [
    { managed: false, available: false, destination },
    { managed: true, available: true, destination, activeCommand: destination },
    { managed: true, available: false, destination },
    { managed: true, available: true, destination, activeCommand: other },
    { managed: false, available: false, destination, selectionUnknown: true },
  ]
  await expect(JSON.stringify({
    dialogs: states.map(state => presentCommandManagement(state, messages, platform)),
  }, null, 2) + '\n').toMatchFileSnapshot(`./expected/command-management-${platform}-${language}.json`)
})
