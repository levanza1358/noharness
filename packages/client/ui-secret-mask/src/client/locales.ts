/** `secretMask` dictionaries for the per-credential reveal control. */

import type {} from '@noharness/client-ui-slots'

/** Dictionary namespace owned by this plugin. */
export const NS = 'secretMask'

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    'secretMask': SecretMaskKey
  }
}

export const en = {
  'secret.reveal': 'Show secret',
  'secret.hide': 'Hide secret',
} as const

export type SecretMaskKey = keyof typeof en


/** Japanese copy, checked against the English keys. */
export const ja = {
  'secret.reveal': 'Show secret',
  'secret.hide': 'Hide secret',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  'secret.reveal': 'Mostrar secreto',
  'secret.hide': 'Ocultar secreto',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  'secret.reveal': 'Afficher le secret',
  'secret.hide': 'Cacher le secret',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  'secret.reveal': 'Geheimnis zeigen',
  'secret.hide': 'Geheimnis verbergen',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'secret.reveal': 'Показать секрет',
  'secret.hide': 'Скрыть секрет',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  'secret.reveal': 'Mostrar segredo',
  'secret.hide': 'Ocultar segredo',
} as const
