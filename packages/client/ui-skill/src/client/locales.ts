/** `skill` namespace dictionaries for the dedicated tool row. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'skill'

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    'skill': SkillKey
  }
}

export const en = {
  'row.title': 'Skill',
  'row.running': 'Loading skill',
  'row.preparing': 'Preparing to load a skill',
  'row.failed': 'Skill load failed',
  'row.stopped': 'Skill load stopped',
  'row.instructions': 'Instructions',
  'row.inspect': 'Inspect',
  'menu.userOnly': 'user-only',
} as const

export type SkillKey = keyof typeof en


/** Japanese copy, checked against the English keys. */
export const ja = {
  'row.title': 'スキル',
  'row.running': 'Loading skill',
  'row.preparing': 'Preparing to load a skill',
  'row.failed': 'Skill load failed',
  'row.stopped': 'Skill load stopped',
  'row.instructions': 'Instructions',
  'row.inspect': 'Inspect',
  'menu.userOnly': 'user-only',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  'row.title': 'Habilidad',
  'row.running': 'Habilidad de carga',
  'row.preparing': 'Preparándose para cargar una habilidad',
  'row.failed': 'La carga de habilidades falló',
  'row.stopped': 'Carga de habilidades detenida',
  'row.instructions': 'Instrucciones',
  'row.inspect': 'inspeccionar',
  'menu.userOnly': 'solo usuario',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  'row.title': 'Compétence',
  'row.running': 'Compétence de chargement',
  'row.preparing': 'Préparation du chargement d’une compétence',
  'row.failed': 'Échec du chargement des compétences',
  'row.stopped': 'Chargement de compétences arrêté',
  'row.instructions': 'Instructions',
  'row.inspect': 'Inspecter',
  'menu.userOnly': 'utilisateur uniquement',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  'row.title': 'Geschicklichkeit',
  'row.running': 'Ladefähigkeit',
  'row.preparing': 'Das Laden eines Skills wird vorbereitet',
  'row.failed': 'Das Laden des Skills ist fehlgeschlagen',
  'row.stopped': 'Das Laden der Fertigkeiten wurde gestoppt',
  'row.instructions': 'Anweisungen',
  'row.inspect': 'Inspizieren',
  'menu.userOnly': 'Nur für Benutzer',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'row.title': 'Навык',
  'row.running': 'Навык загрузки',
  'row.preparing': 'Подготовка к загрузке навыка',
  'row.failed': 'Не удалось загрузить навык',
  'row.stopped': 'Загрузка навыков остановлена',
  'row.instructions': 'Инструкции',
  'row.inspect': 'Осмотреть',
  'menu.userOnly': 'только для пользователей',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  'row.title': 'Habilidade',
  'row.running': 'Habilidade de carregamento',
  'row.preparing': 'Preparando-se para carregar uma habilidade',
  'row.failed': 'Falha no carregamento da habilidade',
  'row.stopped': 'Carga de habilidade interrompida',
  'row.instructions': 'Instruções',
  'row.inspect': 'Inspecionar',
  'menu.userOnly': 'somente usuário',
} as const
