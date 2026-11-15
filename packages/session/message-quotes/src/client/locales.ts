/** Copy owned by the Quote interaction plugin. */

/** Quote plugin dictionary namespace. */
export const NS = 'messageQuotes'

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    'messageQuotes': MessageQuotesKey
  }
}

export const en = {
  'quote.add': 'Quote text',
}

export type MessageQuotesKey = keyof typeof en

/** Japanese dictionary. */
export const ja = {
  'quote.add': 'Quote text',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  'quote.add': 'Texto de cotización',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  'quote.add': 'Texte de citation',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  'quote.add': 'Zitattext',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'quote.add': 'Текст цитаты',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  'quote.add': 'Citação de texto',
} as const
