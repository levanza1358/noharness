import { zoomEn, zoomJa, zoomEs, zoomFr, zoomDe, zoomRu, zoomPt } from '../zoom/locales.ts'


/** Image renderer dictionary keys. */

/** English dictionary with the same keys as the Chinese dictionary. */
export const en = {
  ...zoomEn,
  title: 'Image',
  preview: 'Image preview: {name}',
  loading: 'Rendering document...',
  failed: 'This image could not be displayed.',
  unsupported: 'Image preview requires the complete file contents.',
} as const

export type ImagePreviewKey = keyof typeof en

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Image preview selection, accessible name, and status text. */
    sidebarImage: ImagePreviewKey
  }
}

/** Japanese copy, checked against the English keys. */
export const ja = {
  ...zoomJa,
  'title': 'Image',
  'preview': 'Image preview: {name}',
  'loading': 'Rendering document...',
  'failed': 'This image could not be displayed.',
  'unsupported': 'Image preview requires the complete file contents.',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  ...zoomEs,
  title: 'Imagen',
  preview: 'Vista previa de la imagen: {name}',
  loading: 'Representando documento...',
  failed: 'Esta imagen no se pudo mostrar.',
  unsupported: 'La vista previa de la imagen requiere el contenido completo del archivo.',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  ...zoomFr,
  title: 'Images',
  preview: "Aperçu de l'image : {name}",
  loading: 'Rendu du document...',
  failed: "Cette image n'a pas pu être affichée.",
  unsupported: "L'aperçu de l'image nécessite le contenu complet du fichier.",
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  ...zoomDe,
  title: 'Bild',
  preview: 'Bildvorschau: {name}',
  loading: 'Dokument wird gerendert...',
  failed: 'Dieses Bild konnte nicht angezeigt werden.',
  unsupported: 'Für die Bildvorschau ist der vollständige Dateiinhalt erforderlich.',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  ...zoomRu,
  title: 'Изображение',
  preview: 'Предварительный просмотр изображения: {name}',
  loading: 'Оформление документа...',
  failed: 'Это изображение не может быть отображено.',
  unsupported: 'Для предварительного просмотра изображения требуется полное содержимое файла.',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  ...zoomPt,
  title: 'Imagem',
  preview: 'Visualização da imagem: {name}',
  loading: 'Renderizando documento...',
  failed: 'Esta imagem não pôde ser exibida.',
  unsupported: 'A visualização da imagem requer o conteúdo completo do arquivo.',
} as const
