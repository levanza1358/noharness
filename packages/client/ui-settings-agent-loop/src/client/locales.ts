/** Locale bundles for the agent loop's settings page. */

import type { SettingsFormLabels } from '@noharness/client-ui-primitives'

/** Locale keys the page renders. */
export type AgentLoopSettingsLocaleKey =
  | 'title' | 'description' | 'maxParallel' | 'maxParallelHint'
  | 'overridden' | 'reset' | 'readOnly' | 'unavailable'
  | 'save' | 'saving' | 'saveFailed' | 'unsaved' | 'invalidNumber' | 'presets'

/** English copy. */
export const en: Record<AgentLoopSettingsLocaleKey, string> = {
  title: 'Agent loop',
  description: 'Control how the Agent dispatches tool calls.',
  maxParallel: 'Parallel tool calls',
  maxParallelHint: 'Upper bound on parallel-safe calls running at once within one step.',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  unsaved: 'Unsaved changes',
  presets: 'Preset parallel calls',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
  invalidNumber: 'Enter a number, or leave blank to use the default.',
}

export type SettingsAgentLoopKey = keyof typeof en



/**
 * The form frame's copy, read from this page's dictionary.
 * @param t - the page's locale reader.
 * @returns the labels the shared settings form renders.
 */
export function formLabels(t: (key: AgentLoopSettingsLocaleKey) => string): SettingsFormLabels {
  return {
    unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'),
    save: t('save'), saving: t('saving'), unsaved: t('unsaved'),
  }
}

/** Japanese copy, checked against the English keys. */
export const ja = {
  'title': 'エージェントループ',
  'description': 'Control how the Agent dispatches tool calls.',
  'maxParallel': 'Parallel tool calls',
  'maxParallelHint': 'Upper bound on parallel-safe calls running at once within one step.',
  'overridden': 'Overridden',
  'reset': 'デフォルトにリセット',
  'readOnly': 'This deployment stores settings read-only.',
  'unavailable': 'This plugin is not loaded, so it cannot be configured right now.',
  'save': 'Save',
  'unsaved': '未保存の変更',
  'presets': '同時呼び出しのプリセット',
  'saving': 'Saving…',
  'saveFailed': 'The deployment did not accept these values; they were left for you to correct.',
  'invalidNumber': 'Enter a number, or leave blank to use the default.',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  title: 'Bucle de agente',
  description: 'Controle cómo el Agente distribuye las llamadas a la herramienta.',
  maxParallel: 'Llamadas a herramientas paralelas',
  maxParallelHint: 'Límite superior de llamadas seguras en paralelo que se ejecutan al mismo tiempo en un solo paso.',
  overridden: 'Anulado',
  reset: 'Restablecer los valores predeterminados',
  readOnly: 'Esta implementación almacena configuraciones de solo lectura.',
  unavailable: 'Este complemento no está cargado, por lo que no se puede configurar en este momento.',
  save: 'Guardar',
  unsaved: 'Cambios sin guardar',
  presets: 'Valores de llamadas paralelas',
  saving: 'Guardando…',
  saveFailed: 'El despliegue no aceptó estos valores; quedaron para que usted los corrigiera.',
  invalidNumber: 'Ingrese un número o déjelo en blanco para usar el valor predeterminado.',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  title: "Boucle d'agent",
  description: "Contrôlez la manière dont l'agent distribue les appels d'outil.",
  maxParallel: "Appels d'outils parallèles",
  maxParallelHint: 'Limite supérieure des appels parallèles sécurisés exécutés simultanément en une seule étape.',
  overridden: 'Remplacé',
  reset: 'Réinitialiser aux valeurs par défaut',
  readOnly: 'Ce déploiement stocke les paramètres en lecture seule.',
  unavailable: "Ce plugin n'est pas chargé, il ne peut donc pas être configuré pour le moment.",
  save: 'Enregistrer',
  unsaved: 'Modifications non enregistrées',
  presets: 'Appels parallèles prédéfinis',
  saving: 'Sauvegarde…',
  saveFailed: "Le déploiement n'a pas accepté ces valeurs ; ils vous ont été laissés à corriger.",
  invalidNumber: 'Entrez un numéro ou laissez ce champ vide pour utiliser la valeur par défaut.',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  title: 'Agentenschleife',
  description: 'Steuern Sie, wie der Agent Toolaufrufe verteilt.',
  maxParallel: 'Parallele Werkzeugaufrufe',
  maxParallelHint: 'Obergrenze für parallelsichere Aufrufe, die gleichzeitig innerhalb eines Schritts ausgeführt werden.',
  overridden: 'Überschrieben',
  reset: 'Auf Standard zurücksetzen',
  readOnly: 'Diese Bereitstellung speichert Einstellungen schreibgeschützt.',
  unavailable: 'Dieses Plugin ist nicht geladen und kann daher derzeit nicht konfiguriert werden.',
  save: 'Speichern',
  unsaved: 'Nicht gespeicherte Änderungen',
  presets: 'Voreinstellungen für parallele Aufrufe',
  saving: 'Speichern…',
  saveFailed: 'Die Bereitstellung hat diese Werte nicht akzeptiert. Sie mussten sie korrigieren.',
  invalidNumber: 'Geben Sie eine Zahl ein oder lassen Sie das Feld leer, um den Standardwert zu verwenden.',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'Цикл агента',
  description: 'Управляйте тем, как агент распределяет вызовы инструментов.',
  maxParallel: 'Параллельные вызовы инструментов',
  maxParallelHint: 'Верхняя граница параллельных безопасных вызовов, выполняемых одновременно в течение одного шага.',
  overridden: 'Переопределено',
  reset: 'Сбросить настройки по умолчанию',
  readOnly: 'В этом развертывании параметры сохраняются только для чтения.',
  unavailable: 'Этот плагин не загружен, поэтому его невозможно настроить прямо сейчас.',
  save: 'Сохранить',
  unsaved: 'Несохранённые изменения',
  presets: 'Готовые значения параллельных вызовов',
  saving: 'Сохранение…',
  saveFailed: 'Развертывание не приняло эти значения; их оставили вам на исправление.',
  invalidNumber: 'Введите число или оставьте поле пустым, чтобы использовать значение по умолчанию.',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  title: 'Loop de agente',
  description: 'Controle como o Agente despacha chamadas de ferramenta.',
  maxParallel: 'Chamadas de ferramentas paralelas',
  maxParallelHint: 'Limite superior em chamadas paralelas seguras executadas ao mesmo tempo em uma etapa.',
  overridden: 'Substituído',
  reset: 'Redefinir para o padrão',
  readOnly: 'Esta implantação armazena configurações somente leitura.',
  unavailable: 'Este plugin não está carregado, portanto não pode ser configurado agora.',
  save: 'Salvar',
  unsaved: 'Alterações não guardadas',
  presets: 'Valores de chamadas paralelas',
  saving: 'Salvando…',
  saveFailed: 'A implantação não aceitou esses valores; eles foram deixados para você corrigir.',
  invalidNumber: 'Insira um número ou deixe em branco para usar o padrão.',
} as const
