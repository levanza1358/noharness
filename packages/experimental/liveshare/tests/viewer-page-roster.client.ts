/**
 * Test-only client roster of the assembled viewer page.
 *
 * A served viewer page is the owner's own Web shell with the owner's client plugins; this roster is the
 * subset the viewer page specs need: the wire plugin, the Gateway, remote access, the Session/Workspace controllers,
 * Session status, the menu service, presentation plugins, and the Liveshare `./client` face, which mounts the viewer
 * surfaces when the carrier names a share. Every row is the package's own `/client` face registered as a module-table
 * factory. It must be imported only after {@link prepareViewerRemoteFaces} answered the generated
 * `/remote` faces these plugins import.
 *
 * @module @noharness/experimental-liveshare/tests/viewer-page-roster
 */

import * as apiGateway from '@noharness/api-gateway/client'
import * as apiRemoteAccess from '@noharness/api-remote-access/client'
import * as apiRemotes from '@noharness/api-remotes/client'
import * as apiSessionController from '@noharness/api-session-controller/client'
import * as apiWorkspaceController from '@noharness/api-workspace-controller/client'
import * as clientConnection from '@noharness/client-connection/client'
import * as clientFileUpload from '@noharness/client-file-upload/client'
import * as clientLocale from '@noharness/client-locale/client'
import * as clientModules from '@noharness/client-modules/client'
import * as clientResources from '@noharness/client-resources/client'
import * as clientShortcuts from '@noharness/client-shortcuts/client'
import * as uiAttachment from '@noharness/client-ui-attachment/client'
import * as uiChat from '@noharness/client-ui-chat/client'
import * as uiContextMenu from '@noharness/client-ui-context-menu/client'
import * as uiConversation from '@noharness/client-ui-conversation/client'
import * as uiDeliverables from '@noharness/client-ui-deliverables/client'
import * as uiFileDrag from '@noharness/client-ui-file-drag/client'
import * as uiLayout from '@noharness/client-ui-layout/client'
import * as uiRenderer from '@noharness/client-ui-renderer/client'
import * as uiSession from '@noharness/client-ui-session/client'
import * as uiSessionStatus from '@noharness/client-ui-session-status/client'
import * as uiSettings from '@noharness/client-ui-settings/client'
import * as uiSidebar from '@noharness/client-ui-sidebar/client'
import * as uiSidebarRight from '@noharness/client-ui-sidebar-right/client'
import * as uiTheme from '@noharness/client-ui-theme/client'
import * as uiTool from '@noharness/client-ui-tool/client'
import * as uiTrajectory from '@noharness/client-ui-trajectory/client'
import * as uiWorkspace from '@noharness/client-ui-workspace/client'
import * as typertRegistry from '@noharness/typert-registry/client'
import * as liveshare from '../src/client/index.ts'

/** One module-table row: the entry id the Loader creates, and that plugin's client exports. */
export interface ViewerPageRosterRow {
  readonly id: string
  readonly exports: Readonly<Record<string, unknown>>
}

/** Entry id of the module-system bootstrap whose exports the facade hands to the module system. */
export const VIEWER_PAGE_BOOTSTRAP_ID = '@noharness/client-modules'

/** The viewer page roster; Cordis composes these entries by service injection, so order is irrelevant. */
export const VIEWER_PAGE_ROSTER: readonly ViewerPageRosterRow[] = [
  { id: '@noharness/typert-registry', exports: typertRegistry },
  { id: '@noharness/experimental-liveshare', exports: liveshare },
  { id: VIEWER_PAGE_BOOTSTRAP_ID, exports: clientModules },
  { id: '@noharness/client-connection', exports: clientConnection },
  { id: '@noharness/api-gateway', exports: apiGateway },
  { id: '@noharness/api-remote-access', exports: apiRemoteAccess },
  { id: '@noharness/api-remotes', exports: apiRemotes },
  { id: '@noharness/api-session-controller', exports: apiSessionController },
  { id: '@noharness/api-workspace-controller', exports: apiWorkspaceController },
  { id: '@noharness/client-file-upload', exports: clientFileUpload },
  { id: '@noharness/client-locale', exports: clientLocale },
  { id: '@noharness/client-resources', exports: clientResources },
  { id: '@noharness/client-shortcuts', exports: clientShortcuts },
  { id: '@noharness/client-ui-renderer', exports: uiRenderer },
  { id: '@noharness/client-ui-theme', exports: uiTheme },
  { id: '@noharness/client-ui-settings', exports: uiSettings },
  { id: '@noharness/client-ui-layout', exports: uiLayout },
  { id: '@noharness/client-ui-session', exports: uiSession },
  { id: '@noharness/client-ui-session-status', exports: uiSessionStatus },
  { id: '@noharness/client-ui-sidebar', exports: uiSidebar },
  { id: '@noharness/client-ui-conversation', exports: uiConversation },
  { id: '@noharness/client-ui-chat', exports: uiChat },
  { id: '@noharness/client-ui-context-menu', exports: uiContextMenu },
  { id: '@noharness/client-ui-tool', exports: uiTool },
  { id: '@noharness/client-ui-attachment', exports: uiAttachment },
  { id: '@noharness/client-ui-file-drag', exports: uiFileDrag },
  { id: '@noharness/client-ui-sidebar-right', exports: uiSidebarRight },
  { id: '@noharness/client-ui-trajectory', exports: uiTrajectory },
  { id: '@noharness/client-ui-deliverables', exports: uiDeliverables },
  { id: '@noharness/client-ui-workspace', exports: uiWorkspace },
]
