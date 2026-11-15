/** Locale bundles for the built-in plugins settings section. */

/** Locale keys the section renders. */
export type PluginsSettingsLocaleKey = 'nav' | 'title' | 'intro' | 'tabs' | 'empty'

/** English copy. */
export const en: Record<PluginsSettingsLocaleKey, string> = {
  nav: 'Built-in plugins',
  title: 'Built-in plugins',
  intro: 'Inspect the plugins this deployment ships.',
  tabs: 'Plugin views',
  empty: 'This deployment exposes no plugin views.',
}

export type SettingsPluginsKey = keyof typeof en



/** Japanese copy, checked against the English keys. */
export const ja = {
  'nav': 'Built-in plugins',
  'title': 'Built-in plugins',
  'intro': 'Inspect the plugins this deployment ships.',
  'tabs': 'プラグインビュー',
  'empty': 'このデプロイメントにはプラグインビューがありません。',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  nav: 'Complementos integrados',
  title: 'Complementos integrados',
  intro: 'Inspeccione los complementos que incluye esta implementación.',
  tabs: 'Vistas de complementos',
  empty: 'Esta implementación no expone vistas de complementos.',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  nav: 'Plugins intégrés',
  title: 'Plugins intégrés',
  intro: 'Inspectez les plugins fournis par ce déploiement.',
  tabs: 'Vues des plugins',
  empty: "Ce déploiement n'expose aucune vue de plugin.",
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  nav: 'Integrierte Plugins',
  title: 'Integrierte Plugins',
  intro: 'Überprüfen Sie die Plugins, die mit dieser Bereitstellung geliefert werden.',
  tabs: 'Plugin-Ansichten',
  empty: 'Diese Bereitstellung stellt keine Plugin-Ansichten bereit.',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  nav: 'Встроенные плагины',
  title: 'Встроенные плагины',
  intro: 'Проверьте плагины, поставляемые в этом развертывании.',
  tabs: 'Просмотры плагинов',
  empty: 'Это развертывание не предоставляет никаких представлений плагинов.',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  nav: 'Plug-ins integrados',
  title: 'Plug-ins integrados',
  intro: 'Inspecione os plug-ins fornecidos por esta implantação.',
  tabs: 'Visualizações de plug-in',
  empty: 'Esta implantação não expõe visualizações de plug-ins.',
} as const
