/** Locale bundles for the shell executor's settings page. */

import type { SettingsFormLabels } from '@noharness/client-ui-primitives'

/** Locale keys the page renders. */
export type ShellSettingsLocaleKey =
  | 'title' | 'description'
  | 'timeoutMs' | 'timeoutMsHint' | 'maxOutputBytes' | 'maxOutputBytesHint'
  | 'overridden' | 'reset' | 'readOnly' | 'unavailable'
  | 'save' | 'saving' | 'saveFailed' | 'unsaved' | 'invalidNumber'
  | 'timeoutPresets' | 'presetSeconds' | 'outputPresets' | 'presetKb' | 'presetMb'

/** English copy. */
export const en: Record<ShellSettingsLocaleKey, string> = {
  title: 'Shell',
  description: 'Limit how long each command may run and how much it may output.',
  timeoutMs: 'Command timeout (ms)',
  timeoutMsHint: 'How long one command may run before it is terminated.',
  maxOutputBytes: 'Output cap per stream (bytes)',
  maxOutputBytesHint: 'Output beyond this spills to a temporary file rather than being lost.',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  unsaved: 'Unsaved changes',
  timeoutPresets: 'Timeout presets',
  presetSeconds: '{seconds} s',
  outputPresets: 'Output presets',
  presetKb: '{kilobytes} kB',
  presetMb: '{megabytes} MB',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
  invalidNumber: 'Enter a number, or leave blank to use the default.',
}

export type SettingsShellKey = keyof typeof en



/**
 * The form frame's copy, read from this page's dictionary.
 * @param t - the page's locale reader.
 * @returns the labels the shared settings form renders.
 */
export function formLabels(t: (key: ShellSettingsLocaleKey) => string): SettingsFormLabels {
  return {
    unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'),
    save: t('save'), saving: t('saving'), unsaved: t('unsaved'),
  }
}

/** Japanese copy, checked against the English keys. */
export const ja = {
  'title': 'シェル',
  'description': 'Limit how long each command may run and how much it may output.',
  'timeoutMs': 'コマンドのタイムアウト (ms)',
  'timeoutMsHint': 'How long one command may run before it is terminated.',
  'maxOutputBytes': 'Output cap per stream (bytes)',
  'maxOutputBytesHint': 'Output beyond this spills to a temporary file rather than being lost.',
  'overridden': 'Overridden',
  'reset': 'Reset to default',
  'readOnly': 'This deployment stores settings read-only.',
  'unavailable': 'This plugin is not loaded, so it cannot be configured right now.',
  'save': 'Save',
  'unsaved': '未保存の変更',
  'timeoutPresets': 'タイムアウトのプリセット',
  'presetSeconds': '{seconds} 秒',
  'outputPresets': '出力上限のプリセット',
  'presetKb': '{kilobytes} kB',
  'presetMb': '{megabytes} MB',
  'saving': 'Saving…',
  'saveFailed': 'The deployment did not accept these values; they were left for you to correct.',
  'invalidNumber': 'Enter a number, or leave blank to use the default.',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  title: 'Concha',
  description: 'Limite cuánto tiempo puede ejecutarse cada comando y cuánto puede generar.',
  timeoutMs: 'Tiempo de espera del comando (ms)',
  timeoutMsHint: 'Cuánto tiempo puede ejecutarse un comando antes de finalizar.',
  maxOutputBytes: 'Límite de salida por flujo (bytes)',
  maxOutputBytesHint: 'La salida más allá de esto se transfiere a un archivo temporal en lugar de perderse.',
  overridden: 'Anulado',
  reset: 'Restablecer los valores predeterminados',
  readOnly: 'Esta implementación almacena configuraciones de solo lectura.',
  unavailable: 'Este complemento no está cargado, por lo que no se puede configurar en este momento.',
  save: 'Guardar',
  unsaved: 'Cambios sin guardar',
  timeoutPresets: 'Valores de tiempo de espera',
  presetSeconds: '{seconds} s',
  outputPresets: 'Valores de salida',
  presetKb: '{kilobytes} kB',
  presetMb: '{megabytes} MB',
  saving: 'Guardando…',
  saveFailed: 'El despliegue no aceptó estos valores; quedaron para que usted los corrigiera.',
  invalidNumber: 'Ingrese un número o déjelo en blanco para usar el valor predeterminado.',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  title: 'Coquille',
  description: "Limitez la durée d'exécution de chaque commande et le volume de résultats qu'elle peut générer.",
  timeoutMs: "Délai d'expiration de la commande (ms)",
  timeoutMsHint: "Combien de temps une commande peut s'exécuter avant d'être terminée.",
  maxOutputBytes: 'Limite de sortie par flux (octets)',
  maxOutputBytesHint: "La sortie au-delà de cela se déverse dans un fichier temporaire plutôt que d'être perdue.",
  overridden: 'Remplacé',
  reset: 'Réinitialiser aux valeurs par défaut',
  readOnly: 'Ce déploiement stocke les paramètres en lecture seule.',
  unavailable: "Ce plugin n'est pas chargé, il ne peut donc pas être configuré pour le moment.",
  save: 'Enregistrer',
  unsaved: 'Modifications non enregistrées',
  timeoutPresets: 'Délais prédéfinis',
  presetSeconds: '{seconds} s',
  outputPresets: 'Limites de sortie prédéfinies',
  presetKb: '{kilobytes} kB',
  presetMb: '{megabytes} MB',
  saving: 'Sauvegarde…',
  saveFailed: "Le déploiement n'a pas accepté ces valeurs ; ils vous ont été laissés à corriger.",
  invalidNumber: 'Entrez un numéro ou laissez ce champ vide pour utiliser la valeur par défaut.',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  title: 'Muschel',
  description: 'Begrenzen Sie, wie lange jeder Befehl ausgeführt werden darf und wie viel er ausgeben darf.',
  timeoutMs: 'Befehls-Timeout (ms)',
  timeoutMsHint: 'Wie lange ein Befehl ausgeführt werden darf, bevor er beendet wird.',
  maxOutputBytes: 'Ausgabeobergrenze pro Stream (Byte)',
  maxOutputBytesHint: 'Darüber hinausgehende Ausgaben werden in eine temporäre Datei übertragen und gehen nicht verloren.',
  overridden: 'Überschrieben',
  reset: 'Auf Standard zurücksetzen',
  readOnly: 'Diese Bereitstellung speichert Einstellungen schreibgeschützt.',
  unavailable: 'Dieses Plugin ist nicht geladen und kann daher derzeit nicht konfiguriert werden.',
  save: 'Speichern',
  unsaved: 'Nicht gespeicherte Änderungen',
  timeoutPresets: 'Zeitlimit-Voreinstellungen',
  presetSeconds: '{seconds} s',
  outputPresets: 'Ausgabe-Voreinstellungen',
  presetKb: '{kilobytes} kB',
  presetMb: '{megabytes} MB',
  saving: 'Speichern…',
  saveFailed: 'Die Bereitstellung hat diese Werte nicht akzeptiert. Sie mussten sie korrigieren.',
  invalidNumber: 'Geben Sie eine Zahl ein oder lassen Sie das Feld leer, um den Standardwert zu verwenden.',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'Ракушка',
  description: 'Ограничьте продолжительность выполнения каждой команды и объем вывода.',
  timeoutMs: 'Таймаут команды (мс)',
  timeoutMsHint: 'Как долго может выполняться одна команда до ее завершения.',
  maxOutputBytes: 'Ограничение вывода на поток (байты)',
  maxOutputBytesHint: 'Вывод, выходящий за пределы этого, сохраняется во временный файл, а не теряется.',
  overridden: 'Переопределено',
  reset: 'Сбросить настройки по умолчанию',
  readOnly: 'В этом развертывании параметры сохраняются только для чтения.',
  unavailable: 'Этот плагин не загружен, поэтому его невозможно настроить прямо сейчас.',
  save: 'Сохранить',
  unsaved: 'Несохранённые изменения',
  timeoutPresets: 'Готовые значения тайм-аута',
  presetSeconds: '{seconds} с',
  outputPresets: 'Готовые значения вывода',
  presetKb: '{kilobytes} КБ',
  presetMb: '{megabytes} МБ',
  saving: 'Сохранение…',
  saveFailed: 'Развертывание не приняло эти значения; их оставили вам на исправление.',
  invalidNumber: 'Введите число или оставьте поле пустым, чтобы использовать значение по умолчанию.',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  title: 'Concha',
  description: 'Limite quanto tempo cada comando pode ser executado e quanto ele pode gerar.',
  timeoutMs: 'Tempo limite do comando (ms)',
  timeoutMsHint: 'Quanto tempo um comando pode ser executado antes de ser encerrado.',
  maxOutputBytes: 'Limite de saída por stream (bytes)',
  maxOutputBytesHint: 'A saída além disso é transferida para um arquivo temporário em vez de ser perdida.',
  overridden: 'Substituído',
  reset: 'Redefinir para o padrão',
  readOnly: 'Esta implantação armazena configurações somente leitura.',
  unavailable: 'Este plugin não está carregado, portanto não pode ser configurado agora.',
  save: 'Salvar',
  unsaved: 'Alterações não guardadas',
  timeoutPresets: 'Valores de tempo limite',
  presetSeconds: '{seconds} s',
  outputPresets: 'Valores de saída',
  presetKb: '{kilobytes} kB',
  presetMb: '{megabytes} MB',
  saving: 'Salvando…',
  saveFailed: 'A implantação não aceitou esses valores; eles foram deixados para você corrigir.',
  invalidNumber: 'Insira um número ou deixe em branco para usar o padrão.',
} as const
