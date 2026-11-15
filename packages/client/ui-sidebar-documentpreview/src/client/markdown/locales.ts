
/** Markdown namespace keys. */

/** English labels. */
export const en = {
  'viewer.label': 'Markdown',
  'code.copy': 'Copy',
  'code.copied': 'Copied',
  'footnotes': 'Footnotes',
} as const

export type MarkdownPreviewKey = keyof typeof en

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Markdown document renderer and its code/footnote controls. */
    documentMarkdown: MarkdownPreviewKey
  }
}

/** Japanese copy, checked against the English keys. */
export const ja = {
  'viewer.label': 'Markdown',
  'code.copy': 'コピー',
  'code.copied': 'コピーしました',
  'footnotes': 'Footnotes',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  'viewer.label': 'Markdown',
  'code.copy': 'Copiar',
  'code.copied': 'Copiado',
  'footnotes': 'Notas a pie de página',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  'viewer.label': 'Markdown',
  'code.copy': 'Copier',
  'code.copied': 'Copié',
  'footnotes': 'Notes de bas de page',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  'viewer.label': 'Markdown',
  'code.copy': 'Kopieren',
  'code.copied': 'Kopiert',
  'footnotes': 'Fußnoten',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'viewer.label': 'Markdown',
  'code.copy': 'Копировать',
  'code.copied': 'Скопировано',
  'footnotes': 'Сноски',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  'viewer.label': 'Markdown',
  'code.copy': 'Copiar',
  'code.copied': 'Copiado',
  'footnotes': 'Notas de rodapé',
} as const
