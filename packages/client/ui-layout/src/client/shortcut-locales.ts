declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    'shortcuts.layout': ShortcutKey
  }
}

/** English labels for the same layout commands. */
export const en = { toggle: 'Toggle left sidebar' } as const

/** Layout command label key union. */
export type ShortcutKey = keyof typeof en

/** Japanese copy, checked against the English keys. */
export const ja = {
  'toggle': '左サイドバーを切り替え',
} satisfies Record<ShortcutKey, string>

/** Spanish dictionary, checked against the English keys. */
export const es = { toggle: 'Alternar barra lateral izquierda' } satisfies Record<ShortcutKey, string>

/** French dictionary, checked against the English keys. */
export const fr = { toggle: 'Basculer la barre latérale gauche' } satisfies Record<ShortcutKey, string>

/** German dictionary, checked against the English keys. */
export const de = { toggle: 'Linke Seitenleiste umschalten' } satisfies Record<ShortcutKey, string>

/** Russian dictionary, checked against the English keys. */
export const ru = { toggle: 'Переключить левую боковую панель' } satisfies Record<ShortcutKey, string>

/** Portuguese dictionary, checked against the English keys. */
export const pt = { toggle: 'Alternar barra lateral esquerda' } satisfies Record<ShortcutKey, string>
