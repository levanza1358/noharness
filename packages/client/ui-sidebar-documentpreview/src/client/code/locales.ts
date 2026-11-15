/** Locale-owned code renderer name and CodeBlock controls. */
import type {} from '@noharness/client-ui-slots'

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Code document implementation name and copy controls. */
    sidebarCodePreview: keyof typeof en
  }
}


/** English dictionary with the same keys. */
export const en = {
  title: 'Code',
  copy: 'Copy',
  copied: 'Copied',
} as const

export type Keys = keyof typeof en

/** Japanese copy, checked against the English keys. */
export const ja = {
  'title': 'コード',
  'copy': 'コピー',
  'copied': 'コピーしました',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  title: 'Código',
  copy: 'Copiar',
  copied: 'Copiado',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  title: 'Coder',
  copy: 'Copier',
  copied: 'Copié',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  title: 'Code',
  copy: 'Kopieren',
  copied: 'Kopiert',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'Код',
  copy: 'Копировать',
  copied: 'Скопировано',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  title: 'Código',
  copy: 'Copiar',
  copied: 'Copiado',
} as const
