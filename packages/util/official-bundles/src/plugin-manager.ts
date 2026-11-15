/** The package names the plugin manager protects, hides, orders, or marks experimental. */

/**
 * Plugin packages the plugin manager refuses to disable or remove, because management itself needs them; a bundle that
 * contains one is read-only as well. Removing a name drops only this `management-required` refusal; the manager's own
 * entry, installation-carried bundles, and unaddressable rows stay protected by their own rules.
 */
export const PROTECTED_PLUGINS: ReadonlySet<string> = new Set([
  '@noharness/plugin-manager', '@noharness/cordis-plugin-loader',
  '@noharness/cordis-plugin-include', '@noharness/api-gateway',
  '@noharness/host-webserver', '@noharness/client-modules',
  '@noharness/client-ui-settings-plugin-inventory', '@noharness/client-ui-plugin-manager',
  '@noharness/host-plugin-inventory', '@noharness/typert-registry',
  '@noharness/api-remotes', '@noharness/api-remote-access',
  '@noharness/cordis-plugin-timer', '@noharness/client-connection',
  '@noharness/host-frontend-static', '@noharness/tools',
  '@noharness/hmr',
])

/**
 * Built-in profile bundles, persistent terminals, the standalone worktree tool, and the Computer Use MCP profile
 * bundle, which have no plugin manager page.
 * Their Host availability and activation stay intact.
 */
export const HIDDEN_BUNDLES: ReadonlySet<string> = new Set([
  '@noharness/base',
  '@noharness/web-app',
  '@noharness/headless',
  '@noharness/sdk-app',
  '@noharness/acp-app',
  '@noharness/sdk-minimal',
  '@noharness/experimental-terminal-bundle',
  '@noharness/experimental-tool-worktree',
  '@noharness/cua-mcp',
])

/**
 * The optional bundles the plugin manager's main and More lists rank first, in this order. {@link MORE_BUNDLES}, not
 * this list, decides whether a bundle appears on the main list.
 */
export const EXTENSION_BUNDLES: readonly string[] = [
  '@noharness/experimental-voice-input-bundle',
  '@noharness/experimental-plugin-market-bundle',
  '@noharness/experimental-auto-review',
]

/**
 * The optional bundles the plugin manager's main list leaves out until the profile enables them; its More list,
 * which includes every eligible bundle, ranks them last in this order.
 */
export const MORE_BUNDLES: readonly string[] = [
  '@noharness/personalized-recommendations',
  '@noharness/experimental-inspector-profile',
  '@noharness/cua-bundle',
  '@noharness/timeline',
  '@noharness/experimental-cot-translation-bundle',
  '@noharness/experimental-session-search',
  '@noharness/experimental-session-titles-bundle',
  '@noharness/experimental-badge-skill-bundle',
  '@noharness/experimental-ralph-bundle',
  '@noharness/deepseek-chat-import',
  '@noharness/subagent-codex',
  '@noharness/subagent-claude-code',
]

/** Official bundles the plugin manager marks with the Experimental badge. */
export const EXPERIMENTAL_BUNDLES: ReadonlySet<string> = new Set([
  '@noharness/personalized-recommendations',
  '@noharness/cua-bundle',
  '@noharness/cua-mcp',
  '@noharness/timeline',
  '@noharness/experimental-voice-input-bundle',
  '@noharness/experimental-auto-review',
  '@noharness/experimental-inspector-profile',
  '@noharness/experimental-forge-bundle',
  '@noharness/experimental-tool-worktree',
  '@noharness/experimental-cot-translation-bundle',
  '@noharness/experimental-session-search',
  '@noharness/experimental-session-titles-bundle',
  '@noharness/experimental-badge-skill-bundle',
  '@noharness/experimental-ralph-bundle',
  '@noharness/experimental-plugin-market-bundle',
  '@noharness/experimental-liveshare',
  '@noharness/deepseek-chat-import',
])
