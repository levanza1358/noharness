/** Browser plugin for durable workflow-run Conversation Nodes. */

import type { Context as ClientContext } from '@noharness/cordis'
import type { SessionTarget } from '@noharness/api-session-controller/client'
import type {} from '@noharness/client-locale/client'
import type {} from '@noharness/client-ui-chat/client'
import type {} from '@noharness/client-ui-conversation/client'
import type {} from '@noharness/client-ui-renderer/client'
import type {} from '@noharness/client-ui-session/client'
import type {} from '@noharness/client-ui-session-status/client'
import type {} from '@noharness/client-ui-workspace/client'
import { WorkflowRunPanel, type WorkflowRunInjected } from './WorkflowRunPanel.tsx'
import { en, ja, es, fr, de, ru, pt, NS, type WorkflowRunKey } from './locales.ts'
import { workflowRunDefinition } from './workflow-definition.ts'

declare module '@noharness/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Durable workflow-run node copy. */
    workflowRun: WorkflowRunKey
  }
}

/**
 * Required services for Definition, keyed renderer, navigation, and copy. `uiSession.sessionStatus` provides the
 * `useSessionStatus` hook the run panel renders with, so the plugin unloads and reloads with it.
 */
export const inject = ['uiConversation', 'uiWorkspace', 'slots', 'sessions', 'locale', 'uiSession.sessionStatus']

/** Register the workflow Definition, dictionary, and keyed Chat renderer. */
export function apply(ctx: ClientContext): void {
  ctx.uiConversation.events.register(workflowRunDefinition)
  ctx.effect(() => ctx.locale.register(NS, { en, ja, es, fr, de, ru, pt }), 'ui-workflow-run: dictionaries')
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'workflow-run',
    locale: NS,
    inject: (): WorkflowRunInjected => ({
      openSession: (target: SessionTarget) => { ctx.uiWorkspace.openSession(target) },
    }),
  }, WorkflowRunPanel))
}
