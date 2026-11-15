/** The bundle package names the nhs installation selects, offers, installs on demand, or retires. */

/** Installation-owned defaults used when a shipped profile is first opened. */
export interface ProfileTemplate {
  /** Ordered bundle layer list. */
  bundles: readonly string[]
}

/** The shipped profile templates auto-initialized on first use, by name. */
export const PROFILE_TEMPLATES: Record<string, ProfileTemplate> = {
  acp: {
    bundles: ['@noharness/base', '@noharness/acp-app'],
  },
  web: {
    bundles: ['@noharness/base', '@noharness/web-app'],
  },
  headless: {
    bundles: ['@noharness/base', '@noharness/headless'],
  },
  sdk: {
    bundles: ['@noharness/base', '@noharness/sdk-app'],
  },
  'sdk-minimal': {
    bundles: ['@noharness/sdk-minimal'],
  },
}

/**
 * Installation-owned bundle tuples that an earlier release wrote into a shipped profile; app-boot replaces an exact
 * match with the {@link PROFILE_TEMPLATES} entry of the same name and leaves every other list untouched.
 */
export const INSTALLATION_OWNED_PROFILE_TUPLES: Readonly<Record<string, readonly string[]>> = {
  headless: ['@noharness/base', '@noharness/web-app', '@noharness/headless'],
}

/** Bundles an earlier release shipped and the installation no longer carries; app-boot removes them from profiles. */
export const RETIRED_BUNDLES: ReadonlySet<string> = new Set([
  // The Web composition mounts Schedule itself
  // ([upgrade guide](../../../../docs/upgrade-guide/v0.2.0-rc.2/schedule-bundle-retired/guide.md)).
  '@noharness/experimental-schedule-bundle',
  '@noharness/experimental-agent-team-profile',
])

/** The bundle list a `nhs plugin` init uses for a name with no shipped template. */
export const DEFAULT_PROFILE_BUNDLES: readonly string[] = ['@noharness/base']

/**
 * The bundles the nhs installation ships for a person to switch on: each a
 * runtime dependency of the installation that declares `nhs.bundle.patch`,
 * an `icon`, and `./locale/*.json` display metadata, selected by no shipped
 * template, and offered switched off by the plugin manager except persistent
 * terminals, which have no page switch
 * ([rationale](../../../../.agents/notes/implemented/process/2026-09-15-shipped-optional-bundles.md),
 * [admission](../../../../.agents/notes/implemented/architecture/2026-09-21-experimental-capabilities-as-optional-bundles.md)).
 */
export const OPTIONAL_BUNDLES: readonly string[] = [
  '@noharness/personalized-recommendations',
  '@noharness/cua-bundle',
  '@noharness/cua-mcp',
  '@noharness/timeline',
  '@noharness/experimental-session-search',
  '@noharness/experimental-ralph-bundle',
  '@noharness/experimental-terminal-bundle',
  '@noharness/experimental-badge-skill-bundle',
  '@noharness/experimental-session-titles-bundle',
  '@noharness/experimental-voice-input-bundle',
  '@noharness/experimental-cot-translation-bundle',
  '@noharness/experimental-auto-review',
  '@noharness/experimental-inspector-profile',
  '@noharness/experimental-liveshare',
  '@noharness/experimental-plugin-market-bundle',
  '@noharness/experimental-tool-worktree',
  '@noharness/experimental-forge-bundle',
  '@noharness/deepseek-chat-import',
]

/** Public NHS release members available through the ordinary on-demand bundle installer. */
export const ON_DEMAND_BUNDLES: readonly string[] = [
  '@noharness/subagent-claude-code',
  '@noharness/subagent-codex',
]
