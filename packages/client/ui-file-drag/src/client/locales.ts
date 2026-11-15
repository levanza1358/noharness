export const en = { failed: 'Drag failed. Try again.' } as const

export type FileDragKey = keyof typeof en

/** Japanese file drag failure copy. */
export const ja = { failed: 'ドラッグ＆ドロップに失敗しました。もう一度お試しください。' } as const

/** Spanish dictionary, checked against the English keys. */
export const es = { failed: 'Error al arrastrar. Intentar otra vez.' } as const

/** French dictionary, checked against the English keys. */
export const fr = { failed: 'Le glissement a échoué. Essayer à nouveau.' } as const

/** German dictionary, checked against the English keys. */
export const de = { failed: 'Ziehen ist fehlgeschlagen. Versuchen Sie es erneut.' } as const

/** Russian dictionary, checked against the English keys. */
export const ru = { failed: 'Перетащить не удалось. Попробуйте еще раз.' } as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = { failed: 'Falha ao arrastar. Tente novamente.' } as const

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** File transfer failure feedback. */
    fileDrag: keyof typeof en
  }
}
