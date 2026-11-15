/** `approval` namespace dictionaries. */

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    'approval': ApprovalKey
  }
}

export const en = {
  waiting: 'Waiting for approval',
  'detail.aria': 'Approval details',
  escalation: 'Tool {toolName} requests privileged execution',
  reject: 'Reject',
  allow: 'Allow',
  allowOnce: 'Allow once',
  allowAlways: 'Always allow',
} as const

export type ApprovalKey = keyof typeof en


/** Japanese copy, checked against the English keys. */
export const ja = {
  'waiting': 'Waiting for approval',
  'detail.aria': 'Approval details',
  'escalation': 'Tool {toolName} requests privileged execution',
  'reject': 'Reject',
  'allow': 'Allow',
  'allowOnce': 'Allow once',
  'allowAlways': 'Always allow',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  waiting: 'Esperando aprobación',
  'detail.aria': 'Detalles de aprobación',
  escalation: 'La herramienta {toolName} solicita ejecución privilegiada',
  reject: 'Rechazar',
  allow: 'Permitir',
  allowOnce: 'permitir una vez',
  allowAlways: 'Permitir siempre',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  waiting: "En attente d'approbation",
  'detail.aria': "Détails de l'approbation",
  escalation: "L'outil {toolName} demande une exécution privilégiée",
  reject: 'Rejeter',
  allow: 'Autoriser',
  allowOnce: 'Autoriser une fois',
  allowAlways: 'Toujours autoriser',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  waiting: 'Warten auf Genehmigung',
  'detail.aria': 'Einzelheiten zur Genehmigung',
  escalation: 'Tool {toolName} fordert privilegierte Ausführung an',
  reject: 'Ablehnen',
  allow: 'Erlauben',
  allowOnce: 'Einmal zulassen',
  allowAlways: 'Immer zulassen',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  waiting: 'Ожидание одобрения',
  'detail.aria': 'Детали утверждения',
  escalation: 'Инструмент {toolName} запрашивает привилегированное выполнение',
  reject: 'Отклонить',
  allow: 'Разрешить',
  allowOnce: 'Разрешить один раз',
  allowAlways: 'Всегда разрешать',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  waiting: 'Aguardando aprovação',
  'detail.aria': 'Detalhes de aprovação',
  escalation: 'A ferramenta {toolName} solicita execução privilegiada',
  reject: 'Rejeitar',
  allow: 'Permitir',
  allowOnce: 'Permitir uma vez',
  allowAlways: 'Sempre permitir',
} as const
