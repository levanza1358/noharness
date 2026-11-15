
/** HTML renderer dictionary keys. */

/** English dictionary with the same keys as the Chinese dictionary. */
export const en = {
  title: 'HTML',
  frame: 'HTML document preview',
  loading: 'Rendering document...',
  failed: 'This HTML document could not be previewed.',
} as const

export type HtmlPreviewKey = keyof typeof en

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** HTML preview selection and status text. */
    documentHtml: HtmlPreviewKey
  }
}

/** Japanese copy, checked against the English keys. */
export const ja = {
  'title': 'HTML',
  'frame': 'HTMLドキュメントのプレビュー',
  'loading': 'Rendering document...',
  'failed': 'このHTMLドキュメントをプレビューできませんでした。',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  title: 'HTML',
  frame: 'Vista previa del documento HTML',
  loading: 'Representando documento...',
  failed: 'No se pudo obtener una vista previa de este documento HTML.',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  title: 'HTML',
  frame: 'Aperçu du document HTML',
  loading: 'Rendu du document...',
  failed: "Ce document HTML n'a pas pu être prévisualisé.",
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  title: 'HTML',
  frame: 'Vorschau des HTML-Dokuments',
  loading: 'Dokument wird gerendert...',
  failed: 'Dieses HTML-Dokument konnte nicht in der Vorschau angezeigt werden.',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'HTML',
  frame: 'Предварительный просмотр HTML-документа',
  loading: 'Оформление документа...',
  failed: 'Этот HTML-документ не удалось просмотреть.',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  title: 'HTML',
  frame: 'Pré-visualização do documento HTML',
  loading: 'Renderizando documento...',
  failed: 'Este documento HTML não pôde ser visualizado.',
} as const
