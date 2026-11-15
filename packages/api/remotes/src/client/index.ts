/** Platform-neutral assembly of generated Host Remote contributions. */

import type { Context } from '@noharness/cordis'
import productAnalyticsRemote from '@noharness/client-product-analytics/remote'
export type {} from '@noharness/client-product-analytics/remote'
import agentPresetsRemote from '@noharness/agent-preset-registry/remote'
import userQuestionsRemote from '@noharness/user-questions/remote'
import commandsRemote from '@noharness/commands/remote'
import agentTeamsRemote from '@noharness/agent-team/remote'
export type {} from '@noharness/agent-team/remote'
import accountRemote from '@noharness/deepseek-account/remote'
import settingsControllerRemote from '@noharness/api-settings-controller/remote'
import officeKitRemote from '@noharness/office-kit/remote'
import goalsRemote from '@noharness/goal/remote'
import scheduleRemote from '@noharness/schedule/remote'
import llmRemote from '@noharness/llm/remote'
import dynamicRemote from '@noharness/cordis-host-runner/remote'
import pluginManagerRemote from '@noharness/plugin-manager/remote'
import mcpManagerRemote from '@noharness/mcp-manager/remote'
import toolResultsRemote from '@noharness/client-ui-trajectory/remote'
import pluginRegistryProbeRemote from '@noharness/client-ui-plugin-manager/remote'
import pluginMarketRemote from '@noharness/plugin-market/remote'
import pluginInventoryRemote from '@noharness/host-plugin-inventory/remote'
import messageFeedbackRemote from '@noharness/message-feedback/remote'
import permissionPresetsRemote from '@noharness/permission-presets/remote'
import sessionFeedbackRemote from '@noharness/command-feedback/remote'
import fileUploadsRemote from '@noharness/client-file-upload/remote'
import sessionReferencesRemote from '@noharness/session-reference/remote'
import subagentsRemote from '@noharness/subagent/remote'
import sessionStatusRemote from '@noharness/client-ui-session-status/remote'
export type {} from '@noharness/client-ui-session-status/remote'
import sessionRemote from '@noharness/api-session-controller/remote'
import jobRemote from '@noharness/api-job-controller/remote'
import workspaceRemote from '@noharness/api-workspace-controller/remote'
import terminalRemote from '@noharness/api-terminal-controller/remote'
import workspaceFilesRemote from '@noharness/api-workspace-files/remote'
import webRemote from '@noharness/web/remote'
import type { ClientRemote } from '@noharness/api-gateway/client'

export type { ClientRemote } from '@noharness/api-gateway/client'
export type {
  BundleDetail, BundleInfo, BundleRowInfo, ChangeResult, IncompatiblePlugin, InspectOptions, InstallBundleOptions, InstallSpecKind,
  ManagementError, PackageResult,
  PluginChange, PluginEntryId, PluginInfo, PluginInspectProblem, PluginInstallCancellation, PluginInstallFailureKind,
  PluginInstallLogChunk, PluginInstallProgress, PluginInstallRequestId, PluginRegistries, PluginSpecInspection,
  PluginUpdateProgress, PluginUpdateResult, PluginUpdateStep, PluginVersion, PluginVersionList, RegistryAttempt,
  ReadOnlyReason, Registry, RestartReason,
} from '@noharness/plugin-manager/types'
export type { McpManagedServerStatus, McpManagedServerView } from '@noharness/mcp-manager/types'
export type {} from '@noharness/plugin-manager/remote'
export type {} from '@noharness/mcp-manager/remote'
export type {} from '@noharness/client-ui-plugin-manager/remote'
export type {} from '@noharness/client-ui-trajectory/remote'
export type {} from '@noharness/plugin-market/remote'
export type {
  MarketCompatibility, MarketIndexSummary, MarketInstallation, MarketInstallationStatus, MarketListingEntry, MarketListingVersion,
  MarketQuery, MarketSearchResult, MarketSort, PluginDetail, PluginDetailDocumentId, PluginDetailOrigin,
} from '@noharness/plugin-market/types'
export type { PluginInventorySnapshot } from '@noharness/host-plugin-inventory/types'
export type {} from '@noharness/agent-preset-registry/remote'
export type {} from '@noharness/user-questions/remote'
export type {} from '@noharness/commands/remote'
export type {} from '@noharness/web/remote'
export type {} from '@noharness/api-settings-controller/remote'
export type {} from '@noharness/deepseek-account/remote'
export type {} from '@noharness/goal/remote'
export type {} from '@noharness/schedule/remote'
export type {} from '@noharness/office-kit/remote'
export type {} from '@noharness/llm/remote'
export type {} from '@noharness/host-plugin-inventory/remote'
export type {} from '@noharness/message-feedback/remote'
export type {} from '@noharness/permission-presets/remote'
export type {} from '@noharness/command-feedback/remote'
export type {} from '@noharness/client-file-upload/remote'
export type {} from '@noharness/session-reference/remote'
export type {} from '@noharness/subagent/remote'
export type * from '@noharness/subagent/client'
export type {} from '@noharness/api-session-controller/remote'
export type * from '@noharness/api-session-controller/types'
export type {} from '@noharness/api-job-controller/remote'
export type * from '@noharness/api-job-controller/types'
export type {} from '@noharness/api-workspace-controller/remote'
export type * from '@noharness/api-workspace-controller/types'
export type {} from '@noharness/api-workspace-files/remote'
export type * from '@noharness/api-workspace-files/types'
export type {} from '@noharness/api-terminal-controller/remote'
export type * from '@noharness/api-terminal-controller/types'
// The forwarded-event allowlist's selection seat: without it in the consumer's
// compilation face `TypertRemoteEvent` is `never` and every `$on` call fails.
export type { ApiRemoteForwardedEvent } from '../types.ts'
// The owner packages' client-safe `./types` exports supply the `Events`
// signatures `$on` hands to a listener, so a consumer reads the very
// declaration the Host emits rather than a flattened restatement of it.
export type {} from '@noharness/commands/types'
export type {} from '@noharness/web/types'
export type {} from '@noharness/cordis-host-runner/types'
export type {} from '@noharness/credentials/types'
export type {} from '@noharness/llm/types'
export type {} from '@noharness/agent-preset-registry/types'
export type {} from '@noharness/permission-presets/types'
export type {} from '@noharness/settings/types'
export type {} from '@noharness/user-approval/types'
export type {} from '@noharness/user-questions/types'
export type {} from '@noharness/api-session-controller/types'

/**
 * The carrier's Client-facing types, re-exported so a business package names one
 * assembly package instead of both this facade and the Connection plugin. Type-only:
 * the carrier's runtime values stay behind their own module edge.
 */
export type {
  ConnectionHandle, ConnectionSinks, ContentBlock,
  MessageId,
  RpcId, RpcRequest, RpcResponse, RpcResult, SessionId,
  StreamChunk,
} from '@noharness/client-connection/client'
export type {} from '@noharness/api-gateway/client'
export type {} from '@noharness/cordis-host-runner/remote'

// The payload vocabulary of the selected namespaces, re-exported so a Client
// contribution can name what it sends and receives without importing a Host
// package: this assembly is the one place both planes legitimately meet.
export type {
  ApprovalRequestId,
  CordisHalfState,
  CordisDynamicPackageId,
  CordisDynamicPluginId,
  CordisDynamicPluginRunId,
  CordisDynamicRunMode,
  CordisInspectMethodManifest,
  CordisInspectPlatform,
  CordisInspectProviderManifest,
  CordisInspectProviderView,
  CordisInspectQueryRequest,
  CordisInspectQueryResolution,
  CordisInspectQueryResolved,
  CordisInspectRequestId,
  CordisInspectResolveAck,
  CordisRunDiagnostic,
  CordisRunStatus,
  DynamicCordisClientSource,
  DynamicCordisHostHalfResult,
  DynamicCordisInventoryRow,
  DynamicCordisInvokeResult,
  DynamicCordisPackage,
  DynamicCordisRequestResolved,
  DynamicCordisResolveAck,
  DynamicCordisRetracted,
  DynamicCordisRunRequest,
  DynamicCordisRunResolution,
  DynamicCordisRunAttempt,
  DynamicCordisRunResponse,
  DynamicCordisStopResponse,
  DynamicCordisUndefineReceipt,
  RequestRunOutcome,
} from '@noharness/cordis-host-runner/types'
// Credential state vocabulary for the credentials namespace (values never ride it).
export type { CredentialInfo } from '@noharness/credentials/types'
// Redacted namespace vocabulary for the settings namespace (secrets never ride
// it). It travels with its seam, whose `./types` the Client face already reads.
export type {
  SettingsDescribeValue, SettingsNamespaceView, SettingsPathOpView, SettingsSecretView,
} from '@noharness/settings/types'
// Provider registry and discovery vocabulary for the llm namespace.
export type {
  LlmConfigurableProvider, LlmDiscoveredModel,
  LlmModelDiscoveryRequest, LlmNativeAuth, LlmProviderInfo,
} from '@noharness/llm/types'
// Reference-discovery result vocabulary for the fileReferences and
// sessionReferenceResolver namespaces.
export type { FileReferenceCandidate } from '@noharness/file-reference/types'
export type { SessionReferenceMentionCandidate } from '@noharness/session-reference/types'

// The Remote failure vocabulary, re-exported so business packages keep naming
// this assembly alone. Types only: a value export would make spec imports load
// this module's owner /remote artifacts; specs take RemoteError from
// nhs-client-test-runtime instead.
export type {
  RemoteErrorCode, RemoteErrorDetailsMap, RemoteFailure, RemoteResult,
} from '@noharness/typert-protocol'
export type { RemoteHostFacts } from '@noharness/api-gateway/client'

declare module '@noharness/cordis' {
  interface Context {
    /** Generated Remote namespaces selected by this Client assembly. */
    remote: ClientRemote
  }
}

/** Required service: the typed Client Remote contribution mount. */
export const inject = ['remote']

/**
 * Mount the Host capabilities explicitly selected for this Client assembly.
 * @param ctx - Client Cordis root carrying the typed API service.
 * @returns disposer after every selected Remote namespace is ready.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const disposers: Array<() => Promise<void>> = []
  try {
    for (const contribution of [
      productAnalyticsRemote, agentPresetsRemote, commandsRemote, agentTeamsRemote, settingsControllerRemote, accountRemote,
      goalsRemote, llmRemote, dynamicRemote, scheduleRemote,
      pluginInventoryRemote, pluginManagerRemote, mcpManagerRemote, pluginMarketRemote, pluginRegistryProbeRemote,
      toolResultsRemote,
      messageFeedbackRemote, sessionFeedbackRemote,
      fileUploadsRemote, sessionReferencesRemote,
      permissionPresetsRemote, subagentsRemote, sessionRemote, sessionStatusRemote, jobRemote,
      workspaceRemote, workspaceFilesRemote, terminalRemote,
      officeKitRemote, userQuestionsRemote, webRemote,
    ]) {
      disposers.push(await ctx.remote.$mount(contribution))
    }
  } catch (error) {
    for (const dispose of disposers.reverse()) await dispose()
    throw error
  }
  // Unwound in reverse mount order, so a namespace never outlives one mounted
  // after it.
  return async () => {
    for (const dispose of disposers.reverse()) await dispose()
  }
}
