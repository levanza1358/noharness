import { en as commonEn } from '@noharness/client-locale/src/locales/en.ts'
import { ja as commonJa } from '@noharness/client-locale/src/locales/ja.ts'
import { en, ja, type TrajectoryTranslate } from '../src/client/locales.ts'

function translator(dictionary: Record<string, string>): TrajectoryTranslate {
  return (key, params = {}) => {
    const template = dictionary[key] ?? key
    return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
      const value = params[name]
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : ''
    })
  }
}

/** English trajectory translator for component and pure-layout tests. */
export const t = translator({ ...commonEn, ...en })

/** Japanese trajectory translator for real-view fixtures that open in Japanese. */
export const tJa = translator({ ...commonJa, ...ja })
