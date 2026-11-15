/** Platform client identity headers derived from one call's metadata. */
import { expect, it } from 'vitest'
import { platformClientHeaders } from '../src/client-metadata.ts'

it.each([
  ['darwin', 'desktop-mac'], ['win32', 'desktop-win'], [null, 'web'],
] as const)('maps %s to %s and leaves the bundle ID empty', (platform, expected) => {
  expect(platformClientHeaders(platform, { version: '1.2.3', locale: 'ja-JP', timezoneOffsetSeconds: 28_800 })).toEqual({
    'x-client-bundle-id': '', 'x-client-platform': expected, 'x-client-version': '1.2.3',
    'x-client-locale': 'ja_JP', 'x-client-timezone-offset': '28800',
  })
})

it('selects ja_JP only for a Japanese primary language subtag', () => {
  const locale = (value: string): string | undefined =>
    platformClientHeaders(null, { version: 'v', locale: value, timezoneOffsetSeconds: 0 })['x-client-locale']
  expect(locale('ja')).toBe('ja_JP')
  expect(locale('JA_jp')).toBe('ja_JP')
  for (const value of ['en', 'en-US', 'fr-FR', 'English', '', 'zhx']) expect(locale(value)).toBe('en_US')
})
