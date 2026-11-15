/** Locale-owned application-access approval messages. */

/** English application-access messages. */
export const en = {
  question: 'Allow agent to control this application via computer use?',
  detail: 'Manage app permissions for all sessions on the plugin page.',
  approve: 'Allow for this session',
}

/** Chinese application-access messages. */
export const zh = {
  question: 'Allow agent to control this application via computer use?',
  detail: 'Manage app permissions for all sessions on the plugin page.',
  approve: 'Allow for this session',
} as const

/** Japanese application-access messages. */
export const ja = {
  question: 'Allow agent to control this application via computer use?',
  detail: 'Manage app permissions for all sessions on the plugin page.',
  approve: 'Allow for this session',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  question: '¿Permitir que el agente controle esta aplicación mediante Computer Use?',
  detail: 'Gestiona los permisos de las aplicaciones para todas las sesiones en la página del plugin.',
  approve: 'Permitir durante esta sesión',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  question: 'Autoriser l’agent à contrôler cette application via Computer Use ?',
  detail: 'Gérez les autorisations des applications pour toutes les sessions sur la page du plugin.',
  approve: 'Autoriser pour cette session',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  question: 'Darf der Agent diese Anwendung über Computer Use steuern?',
  detail: 'Verwalten Sie App-Berechtigungen für alle Sitzungen auf der Plugin-Seite.',
  approve: 'Für diese Sitzung zulassen',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  question: 'Разрешить агенту управлять этим приложением через Computer Use?',
  detail: 'Управляйте разрешениями приложений для всех сеансов на странице плагина.',
  approve: 'Разрешить для этого сеанса',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  question: 'Permitir que o agente controle este aplicativo via Computer Use?',
  detail: 'Gerencie as permissões dos aplicativos para todas as sessões na página do plugin.',
  approve: 'Permitir nesta sessão',
} as const

/** Display translations resolved by the Client; wire choices stay unchanged. */
export const applicationAccessDisplay = {
  question: {
    en: en.question,
    zh: zh.question,
    ja: ja.question,
    es: es.question,
    fr: fr.question,
    de: de.question,
    ru: ru.question,
    pt: pt.question,
  },
  detail: { en: en.detail, zh: zh.detail, ja: ja.detail, es: es.detail, fr: fr.detail, de: de.detail, ru: ru.detail, pt: pt.detail },
  approve: {
    en: en.approve,
    zh: zh.approve,
    ja: ja.approve,
    es: es.approve,
    fr: fr.approve,
    de: de.approve,
    ru: ru.approve,
    pt: pt.approve,
  },
}

/** Window consent never grants access to sibling windows or application launch. */
export const windowAccessQuestion = {
  en: 'Allow computer use to read, capture and control this window?',
  zh: 'Allow computer use to read, capture and control this window?',
  ja: 'このウィンドウの読み取り、撮影、操作を許可しますか？',
  es: '¿Permitir leer, capturar y controlar esta ventana?',
  fr: 'Autoriser la lecture, la capture et le contrôle de cette fenêtre ?',
  de: 'Lesen, Aufnehmen und Steuern dieses Fensters erlauben?',
  ru: 'Разрешить чтение, снимки и управление этим окном?',
  pt: 'Permitir ler, capturar e controlar esta janela?',
}
/** Launch consent does not grant access to resulting windows. */
export const launchAccessQuestion = {
  en: 'Allow computer use to launch this entry? Window access is requested separately.',
  zh: 'Allow computer use to launch this entry? Window access is requested separately.',
  ja: 'この項目の起動を許可しますか？ウィンドウへのアクセスは別途確認します。',
  es: '¿Permitir iniciar esta entrada? El acceso a ventanas se solicita por separado.',
  fr: 'Autoriser le lancement de cette entrée ? L’accès aux fenêtres sera demandé séparément.',
  de: 'Diesen Eintrag starten? Fensterzugriff wird separat angefragt.',
  ru: 'Разрешить запуск? Доступ к окнам запрашивается отдельно.',
  pt: 'Permitir iniciar esta entrada? O acesso às janelas é solicitado separadamente.',
}
