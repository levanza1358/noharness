declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    'entryCustomization': EntryCustomizationKey
  }
}

/** Copy for the More menu rows: navigation actions, and Creator draft prompts per region. */
export const en = {
  'pinTooltip': 'Pin to left sidebar',
  'pin': 'Pin {name} to sidebar',
  install: 'Browse other plugins',
  create: 'Create your plugin',
  'createPrompt.sidebar': 'Create a NHS plugin with a left sidebar entry.',
  'createPrompt.conversation': 'Create a NHS conversation view plugin.',
  'createPrompt.rightbar': 'Create a NHS plugin with a right sidebar entry.',
} as const

export type EntryCustomizationKey = keyof typeof en



/** Japanese copy, checked against the English keys. */
export const ja = {
  'pinTooltip': 'Pin to left sidebar',
  'pin': 'Pin {name} to sidebar',
  'install': 'Browse other plugins',
  'create': 'Create your plugin',
  'createPrompt.sidebar': 'Create a NHS plugin with a left sidebar entry.',
  'createPrompt.conversation': 'Create a NHS conversation view plugin.',
  'createPrompt.rightbar': 'Create a NHS plugin with a right sidebar entry.',
} as const

/** Spanish dictionary, checked against the English keys. */
export const es = {
  'pinTooltip': 'Fijar a la barra lateral izquierda',
  'pin': 'Fijar {name} en la barra lateral',
  install: 'Explorar otros complementos',
  create: 'Crea tu complemento',
  'createPrompt.sidebar': 'Cree un complemento NHS con una entrada en la barra lateral izquierda.',
  'createPrompt.conversation': 'Cree un complemento de vista de conversación NHS.',
  'createPrompt.rightbar': 'Cree un complemento NHS con una entrada en la barra lateral derecha.',
} as const

/** French dictionary, checked against the English keys. */
export const fr = {
  'pinTooltip': 'Épingler sur la barre latérale gauche',
  'pin': 'Épingler {name} à la barre latérale',
  install: "Parcourir d'autres plugins",
  create: 'Créez votre plugin',
  'createPrompt.sidebar': 'Créez un plugin NHS avec une entrée dans la barre latérale gauche.',
  'createPrompt.conversation': "Créez un plugin d'affichage de conversation NHS.",
  'createPrompt.rightbar': 'Créez un plugin NHS avec une entrée dans la barre latérale droite.',
} as const

/** German dictionary, checked against the English keys. */
export const de = {
  'pinTooltip': 'An die linke Seitenleiste anpinnen',
  'pin': '{name} an der Seitenleiste anheften',
  install: 'Durchsuchen Sie andere Plugins',
  create: 'Erstellen Sie Ihr Plugin',
  'createPrompt.sidebar': 'Erstellen Sie ein NHS-Plugin mit einem Eintrag in der linken Seitenleiste.',
  'createPrompt.conversation': 'Erstellen Sie ein NHS-Plugin für die Konversationsansicht.',
  'createPrompt.rightbar': 'Erstellen Sie ein NHS-Plugin mit einem Eintrag in der rechten Seitenleiste.',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'pinTooltip': 'Закрепить на левой боковой панели',
  'pin': 'Закрепить {name} на боковой панели',
  install: 'Просмотрите другие плагины',
  create: 'Создайте свой плагин',
  'createPrompt.sidebar': 'Создайте плагин NHS с записью на левой боковой панели.',
  'createPrompt.conversation': 'Создайте плагин просмотра диалога NHS.',
  'createPrompt.rightbar': 'Создайте плагин NHS с записью на правой боковой панели.',
} as const

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  'pinTooltip': 'Fixar na barra lateral esquerda',
  'pin': 'Fixar {name} na barra lateral',
  install: 'Procure outros plug-ins',
  create: 'Crie seu plug-in',
  'createPrompt.sidebar': 'Crie um plug-in NHS com uma entrada na barra lateral esquerda.',
  'createPrompt.conversation': 'Crie um plug-in de visualização de conversa NHS.',
  'createPrompt.rightbar': 'Crie um plug-in NHS com uma entrada na barra lateral direita.',
} as const
