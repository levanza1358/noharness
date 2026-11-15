
/** English labels checked against the bottom-panel dictionary. */
export const en = {
  title: 'NodeJS inspector',
  toggle: 'Toggle NodeJS inspector',
  close: 'Collapse',
  resize: 'Resize NodeJS inspector panel',
  frameTitle: 'NodeJS inspector',
}

export type Keys = keyof typeof en

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Shared Inspector frontend copy. */
    inspectorPanel: keyof typeof en
  }
}

/** Japanese copy, checked against the English keys. */
export const ja = {
  'title': 'NodeJS インスペクター',
  'toggle': 'Toggle NodeJS inspector',
  'close': 'Collapse',
  'resize': 'Resize NodeJS inspector panel',
  'frameTitle': 'NodeJS インスペクター',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  title: 'Inspector NodeJS',
  toggle: 'Alternar inspector NodeJS',
  close: 'Contraer',
  resize: 'Cambiar el tamaño del panel inspector NodeJS',
  frameTitle: 'Inspector NodeJS',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  title: 'Inspecteur NodeJS',
  toggle: "Basculer l'inspecteur NodeJS",
  close: 'Réduire',
  resize: "Redimensionner le panneau d'inspection NodeJS",
  frameTitle: 'Inspecteur NodeJS',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  title: 'NodeJS-Inspektor',
  toggle: 'Schalten Sie den NodeJS-Inspektor um',
  close: 'Einklappen',
  resize: 'Größe des NodeJS-Inspektorfelds ändern',
  frameTitle: 'NodeJS-Inspektor',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'NodeJS инспектор',
  toggle: 'Переключить инспектор NodeJS',
  close: 'Свернуть',
  resize: 'Изменение размера панели инспектора NodeJS',
  frameTitle: 'NodeJS инспектор',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  title: 'NodeJS inspetor',
  toggle: 'Alternar inspetor NodeJS',
  close: 'Recolher',
  resize: 'Redimensionar painel do inspetor NodeJS',
  frameTitle: 'NodeJS inspetor',
} as const
