/** Evaluate plugin nhs requirements (`engines.nhs`, else nhs peers) without importing plugin code. */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

/** Read the version installed for one peer from the plugin's own resolution base. */
export type PeerVersionResolver = (name: string) => string | undefined

/** Workspace ranges name whatever the running runtime supplies, so no installed lookup is needed. */
const WORKSPACE_RANGES = new Set(['workspace:^', 'workspace:~', 'workspace:*'])

/** Unmet nhs requirements and the exact plugin/runtime exemption decision. */
export interface PluginCompatibility {
  name: string
  version: string
  runtimeVersion: string
  /** Only requirements the running nhs version does not satisfy: `engines.nhs`, or nhs peer package names. */
  requirements: Record<string, string>
  exempted: boolean
}

function objectOf(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be an object`)
  }
  return value as Record<string, unknown>
}

function runtimeVersionOf(value: unknown): string {
  if (typeof value !== 'string' || semver.valid(value) === null) {
    throw new Error(`Invalid nhs runtime version: ${JSON.stringify(value)}; expected a semantic version`)
  }
  return value
}

function identityField(manifest: Record<string, unknown>, field: 'name' | 'version'): string {
  const value = Object.hasOwn(manifest, field) ? manifest[field] : undefined
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Plugin manifest ${field} must be a non-empty string when nhs requirements are unmet`)
  }
  return value
}

/**
 * Read this app-boot package's version in both source and bundled installations.
 * @returns the validated runtime semantic version, preserving its exact spelling.
 * @throws if package.json cannot be read or its version is missing or invalid.
 */
export function getDshRuntimeVersion(): string {
  // The executable's virtual filesystem intercepts string paths, not URL arguments.
  const filename = fileURLToPath(new URL('../package.json', import.meta.url))
  const manifest = objectOf(JSON.parse(fs.readFileSync(filename, 'utf8')), 'app-boot package.json')
  return runtimeVersionOf(Object.hasOwn(manifest, 'version') ? manifest.version : undefined)
}

function satisfies(runtimeVersion: string, range: string): boolean {
  return range.trim() !== '' && semver.satisfies(runtimeVersion, range, { includePrerelease: true })
}

/**
 * Build a peer resolver that reads versions installed beside a plugin.
 * At least one `@noharness/*` peer keeps its own version line — the vendored Cordis packages ship
 * from this workspace under the same scope — so their ranges cannot be compared with the nhs version.
 * @param base - Absolute path or file URL whose Node package resolution finds the plugin's dependencies.
 * @returns Resolver returning the installed version, or undefined when the package cannot be read.
 */
export function installedPeerVersions(base: string | URL): PeerVersionResolver {
  let require: NodeJS.Require
  try { require = createRequire(base) }
  catch { return () => undefined }
  return (name) => {
    try {
      const manifest: unknown = require(`${name}/package.json`)
      if (typeof manifest !== 'object' || manifest === null) return undefined
      const version = (manifest as Record<string, unknown>).version
      return typeof version === 'string' ? version : undefined
    }
    // An unreadable peer manifest keeps the runtime-version fallback; the row's own import failure surfaces separately.
    catch { return undefined }
  }
}

function unmetRequirements(
  fields: Record<string, unknown>,
  runtimeVersion: string,
  resolvePeerVersion: PeerVersionResolver | undefined,
): Record<string, string> {
  const engines = Object.hasOwn(fields, 'engines') ? objectOf(fields.engines, 'Plugin manifest engines') : {}
  if (Object.hasOwn(engines, 'nhs')) {
    const range = engines.nhs
    if (typeof range !== 'string') throw new Error('Plugin manifest engines.nhs must be a string')
    return satisfies(runtimeVersion, range) ? {} : { 'engines.nhs': range }
  }
  if (!Object.hasOwn(fields, 'peerDependencies')) return {}
  const dependencies = objectOf(fields.peerDependencies, 'Plugin manifest peerDependencies')
  const unmet: Record<string, string> = {}
  for (const [name, range] of Object.entries(dependencies)) {
    if (typeof range !== 'string') {
      throw new Error(`Plugin manifest peerDependencies[${JSON.stringify(name)}] must be a string`)
    }
    if (name !== '@noharness/cli' && !name.startsWith('@noharness/')) continue
    const required = WORKSPACE_RANGES.has(range) ? runtimeVersion : range
    const installed = WORKSPACE_RANGES.has(range) ? runtimeVersion : resolvePeerVersion?.(name) ?? runtimeVersion
    if (!satisfies(installed, required)) unmet[name] = range
  }
  return unmet
}

/**
 * Check the plugin's nhs requirements against the runtime. An own `engines.nhs` range decides alone and
 * peerDependencies are ignored; otherwise every @noharness/cli or @noharness/* peer must match.
 * Prereleases participate in ranges. For peers only, workspace:^, workspace:~, and workspace:* refer to
 * the current runtime, and a peer without a workspace range is compared with the version installed beside
 * the plugin when the caller supplies a resolver; other empty or invalid ranges, including any workspace:
 * `engines.nhs`, are unmet.
 * @param manifest - parsed plugin package.json; inherited fields are ignored.
 * @param exemptions - exact plugin name@version keys mapped to exact runtime versions.
 * @param runtimeVersion - running nhs version, defaulting to this app-boot package.
 * @param resolvePeerVersion - installed-version lookup for non-workspace peers; undefined falls back to `runtimeVersion`.
 * @returns unmet requirements and exemption status, or undefined when every requirement is met.
 * @throws for malformed manifest engines or peer fields, invalid runtime versions, or missing identity on a mismatch.
 */
export function evaluatePluginCompatibility(
  manifest: object,
  exemptions: Readonly<Record<string, readonly string[]>> = {},
  runtimeVersion = getDshRuntimeVersion(),
  resolvePeerVersion?: PeerVersionResolver,
): PluginCompatibility | undefined {
  runtimeVersionOf(runtimeVersion)
  const fields = objectOf(manifest, 'Plugin manifest')
  const requirements = unmetRequirements(fields, runtimeVersion, resolvePeerVersion)
  if (Object.keys(requirements).length === 0) return undefined
  const name = identityField(fields, 'name')
  const version = identityField(fields, 'version')
  const key = `${name}@${version}`
  const exemptedVersions = Object.hasOwn(exemptions, key) ? exemptions[key] : undefined
  const exempted = exemptedVersions?.includes(runtimeVersion) === true
  return { name, version, runtimeVersion, requirements, exempted }
}

/**
 * Describe unmet requirements, their risk, and the exact-version remedy.
 * Surfaces with their own grant mechanism or locale render the structured result themselves.
 * @param issue - incompatible plugin/runtime result, including exempted mismatches.
 * @returns an English diagnostic for logs and stderr.
 */
export function pluginCompatibilityWarning(issue: PluginCompatibility): string {
  const key = `${issue.name}@${issue.version}`
  return `Plugin ${key} is incompatible with nhs ${issue.runtimeVersion}: requirements ${JSON.stringify(issue.requirements)}. `
    + 'Running it may cause crashes or data loss. '
    + 'Update the plugin or install a plugin version compatible with this nhs runtime. '
    + `To accept this risk explicitly, grant the exact-version exemption for ${key} on nhs ${issue.runtimeVersion} with \`nhs plugin allow-version\` or the plugin manager, then retry the installation or restart nhs. `
    + `Exact-version exemption: ${issue.exempted ? 'active' : 'not active'}.`
}
