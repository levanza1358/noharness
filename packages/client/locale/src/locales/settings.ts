/** `settings.locale` namespace dictionaries (the Language row's copy). */

/** English dictionary (the key-set source of truth). */
export const en = {
  'language.title': 'Language',
} satisfies Record<string, string>

/** The settings.locale namespace key union. */
export type SettingsLocaleKey = keyof typeof en

/** Japanese copy, checked against the English keys. */
export const ja = {
  'language.title': '言語',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  'language.title': 'Idioma',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  'language.title': 'Langue',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  'language.title': 'Sprache',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'language.title': 'Язык',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  'language.title': 'Idioma',
} as const
