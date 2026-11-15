/**
 * Shared wire protocol for the NoHarness SDK runtime: the
 * newline-delimited JSON-RPC stdio transport plus the named request, result,
 * and notification types both wire ends speak. The runtime server plugin
 * (`@noharness/sdk-jsonrpc-server`) serves this protocol; SDK clients
 * (`@noharness/sdk-client`, the Python SDK) drive it.
 *
 * @module @noharness/sdk-protocol
 */

export { JsonRpcLineTransport, JsonRpcResponseError } from './transport.ts'
export type { JsonRpcTransportPeer } from './transport.ts'
export type {
  ApprovalRequestParams,
  ApprovalRequestResult,
  CommandExecution,
  HarnessSdkClientRequestMap,
  HarnessSdkNotificationMap,
  HarnessSdkRequestMap,
  HarnessSdkHostRequestMap,
  InitializeParams,
  InitializeResult,
  SdkEncodedImageBlock,
  SdkPromptContentBlock,
  SdkRunStatus,
  SdkUserQuestionRequest,
  SdkUserQuestionAnswer,
  SdkUserQuestionResult,
  SdkUserQuestionCancelled,
  SessionEventNotification,
  SessionQueryParams,
  SessionQueryResult,
  SessionStatusNotification,
  SessionPromptParams,
  SessionPromptResult,
  SessionResumeParams,
  SessionWaitParams,
  SessionWorkingDirectoryParams,
  SessionWorkingDirectorySetParams,
  SessionWorkingDirectoryResult,
  SubagentFinishedNotification,
  SubagentStartedNotification,
} from './types.ts'
