/** `sidebar` namespace dictionaries for shell controls and global panels. */

export const en = {
  'panels.unpinTooltip': 'Unpin from left sidebar',
  'panels.unpin': 'Unpin {name} from sidebar',
  'session.new': 'New Session',
  'session.new.label': 'New session',
  'toggle.open': 'Open sidebar',
  'toggle.collapse': 'Collapse sidebar',
  'panels.label': 'Global panels',
  'navigation.label': 'Navigation',
  'panels.more': 'More',
} as const

export type SidebarKey = keyof typeof en


/** Japanese copy, checked against the English keys. */
export const ja = {
  'panels.unpinTooltip': 'Unpin from left sidebar',
  'panels.unpin': 'Unpin {name} from sidebar',
  'session.new': 'New Session',
  'session.new.label': 'New session',
  'toggle.open': 'Open sidebar',
  'toggle.collapse': 'Collapse sidebar',
  'panels.label': 'グローバルパネル',
  'navigation.label': 'ナビゲーション',
  'panels.more': 'More',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  'panels.unpinTooltip': 'Desanclar de la barra lateral izquierda',
  'panels.unpin': 'Desfijar {name} de la barra lateral',
  'session.new': 'Nueva sesión',
  'session.new.label': 'Nueva sesión',
  'toggle.open': 'Abrir barra lateral',
  'toggle.collapse': 'Contraer barra lateral',
  'panels.label': 'Paneles globales',
  'navigation.label': 'Navegación',
  'panels.more': 'Más',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  'panels.unpinTooltip': "Retirer l'épingle de la barre latérale gauche",
  'panels.unpin': 'Désépingler {name} de la barre latérale',
  'session.new': 'Nouvelle séance',
  'session.new.label': 'Nouvelle séance',
  'toggle.open': 'Ouvrir la barre latérale',
  'toggle.collapse': 'Réduire la barre latérale',
  'panels.label': 'Panneaux globaux',
  'navigation.label': 'Navigation',
  'panels.more': 'Plus',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  'panels.unpinTooltip': 'Von der linken Seitenleiste lösen',
  'panels.unpin': '{name} von der Seitenleiste lösen',
  'session.new': 'Neue Sitzung',
  'session.new.label': 'Neue Sitzung',
  'toggle.open': 'Seitenleiste öffnen',
  'toggle.collapse': 'Seitenleiste einklappen',
  'panels.label': 'Globale Bereiche',
  'navigation.label': 'Navigation',
  'panels.more': 'Mehr',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'panels.unpinTooltip': 'Открепить от левой боковой панели',
  'panels.unpin': 'Открепить {name} от боковой панели',
  'session.new': 'Новая сессия',
  'session.new.label': 'Новая сессия',
  'toggle.open': 'Открыть боковую панель',
  'toggle.collapse': 'Свернуть боковую панель',
  'panels.label': 'Глобальные панели',
  'navigation.label': 'Навигация',
  'panels.more': 'Ещё',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  'panels.unpinTooltip': 'Soltar da barra lateral esquerda',
  'panels.unpin': 'Desafixar {name} da barra lateral',
  'session.new': 'Nova sessão',
  'session.new.label': 'Nova sessão',
  'toggle.open': 'Abrir barra lateral',
  'toggle.collapse': 'Recolher barra lateral',
  'panels.label': 'Painéis globais',
  'navigation.label': 'Navegação',
  'panels.more': 'Mais',
} as const
