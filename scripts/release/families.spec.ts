/** Release family discovery, publish order, tag naming, and the bump judgements. */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { officialClientBuildEnvironment, writeClientBuildRecord } from '../client-build-environment.ts'
import { ON_DEMAND_BUNDLES } from '../../packages/util/official-bundles/src/bundles.ts'
import { releaseFamily, type ReleaseMember } from './families.ts'
import { compareVersions, nextVendorVersion, planShared, reachesPayload } from './bump.ts'

/**
 * A release member standing in for a manifest on disk.
 * @param directory - repository-relative package directory.
 * @param name - package name.
 * @param manifest - manifest fields the subject reads.
 * @returns The member.
 */
function member(directory: string, name: string, manifest: Record<string, unknown> = {}): ReleaseMember {
  return { directory, name, version: '0.0.1', manifest }
}

const roots: string[] = []

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

function buildFixture(environment: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'nhs-release-build-'))
  roots.push(root)
  write(join(root, 'package.json'), `${JSON.stringify({ version: environment.NHS_CLIENT_VERSION ?? '0.0.1' })}\n`)
  write(join(root, 'apps/web/dist/index.html'), '<main></main>')
  write(join(root, 'packages/client/example/lib/client.js'), 'module.exports = {}\n')
  writeClientBuildRecord(root, environment)
  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
  vi.unstubAllEnvs()
})

describe('release families', () => {
  it('publishes all current experimental packages', () => {
    const members = releaseFamily('nhs').members(resolve(import.meta.dirname, '../..'))

    expect(members
      .filter(member => member.directory.startsWith('packages/experimental/'))
      .map(member => member.name)).toEqual([
      '@noharness/action-cards',
      '@noharness/experimental-api-speech-to-text',
      '@noharness/experimental-auto-review',
      '@noharness/experimental-badge-skill-bundle',
      '@noharness/experimental-browser-use-chrome-devtools-mcp',
      '@noharness/experimental-browser-use-playwright-mcp',
      '@noharness/experimental-browser-use-runtime',
      '@noharness/experimental-browser-use-stagehand-native',
      '@noharness/experimental-claude-code-mods',
      '@noharness/client-ui-action-cards',
      '@noharness/experimental-client-ui-claude-code-mods',
      '@noharness/experimental-client-ui-cot-translation',
      '@noharness/client-ui-creation-recommendations',
      '@noharness/experimental-client-ui-forge',
      '@noharness/client-ui-plugin-recommendations',
      '@noharness/experimental-client-ui-stats',
      '@noharness/experimental-client-ui-voice-input',
      '@noharness/experimental-computer-use-cua-driver-mcp',
      '@noharness/experimental-computer-use-cua-driver-native',
      '@noharness/experimental-cot-translation-bundle',
      '@noharness/creation-recommendations',
      '@noharness/cua-bundle',
      '@noharness/cua-macos',
      '@noharness/cua-mcp',
      '@noharness/cua-windows',
      '@noharness/cua',
      '@noharness/deepseek-chat-import',
      '@noharness/experimental-forge-bundle',
      '@noharness/experimental-forge-github',
      '@noharness/experimental-forge-session',
      '@noharness/experimental-forge',
      '@noharness/hook-protocol',
      '@noharness/hooks-claude-code',
      '@noharness/hooks-codex',
      '@noharness/experimental-inspector-profile',
      '@noharness/experimental-inspector',
      '@noharness/experimental-liveshare-protocol',
      '@noharness/experimental-liveshare',
      '@noharness/personalized-recommendations',
      '@noharness/experimental-plugin-market-bundle',
      '@noharness/plugin-recommendations',
      '@noharness/experimental-ralph-bundle',
      '@noharness/experimental-session-inspector',
      '@noharness/experimental-session-search',
      '@noharness/session-title-all-prompts-llm',
      '@noharness/experimental-session-titles-bundle',
      '@noharness/skill-badge',
      '@noharness/experimental-speech-to-text-sensevoice',
      '@noharness/experimental-speech-to-text',
      '@noharness/experimental-subagent-oar',
      '@noharness/experimental-terminal-bundle',
      '@noharness/terminal-panel',
      '@noharness/timeline',
      '@noharness/tool-ralph',
      '@noharness/tool-session-query',
      '@noharness/experimental-tool-subagent-oar',
      '@noharness/tool-terminal',
      '@noharness/experimental-tool-worktree',
      '@noharness/experimental-translator',
      '@noharness/experimental-voice-input-bundle',
      '@noharness/webhook-github',
      '@noharness/webhook',
      '@noharness/experimental-webworker-packer',
      '@noharness/experimental-webworker-runtime',
      '@noharness/experimental-worktree',
    ])
  })

  it('excludes private applications from the publish set', () => {
    const root = mkdtempSync(join(tmpdir(), 'nhs-release-private-'))
    roots.push(root)
    write(join(root, 'apps/public/package.json'), '{"name":"@noharness/public","version":"0.0.1"}\n')
    write(join(root, 'apps/private/package.json'), '{"name":"@noharness/private","version":"0.0.1","private":true}\n')

    expect(releaseFamily('nhs').members(root).map(entry => entry.name)).toEqual(['@noharness/public'])
  })

  it('publishes unlisted experimental packages while retaining private exclusions', () => {
    const root = mkdtempSync(join(tmpdir(), 'nhs-release-experimental-'))
    roots.push(root)
    write(join(root, 'packages/experimental/prototype/package.json'), JSON.stringify({
      name: '@noharness/experimental-prototype',
      version: '0.0.1',
      publishConfig: { access: 'public' },
    }))
    write(join(root, 'packages/experimental/inspector/package.json'), JSON.stringify({
      name: '@noharness/experimental-inspector',
      version: '0.0.1',
      private: true,
    }))

    expect(releaseFamily('nhs').members(root).map(entry => entry.name)).toEqual([
      '@noharness/experimental-prototype',
    ])
  })

  it('bumps private nhs workspaces without adding release tags', () => {
    const root = mkdtempSync(join(tmpdir(), 'nhs-release-version-'))
    roots.push(root)
    write(join(root, 'package.json'), '{"version":"0.0.1"}\n')
    write(join(root, 'apps/desktop/package.json'), '{"version":"0.0.1","private":true}\n')
    write(join(root, 'packages/experimental/prototype/package.json'), '{"version":"0.0.1","private":true}\n')
    write(join(root, 'packages/core/unselected/package.json'), '{"version":"0.0.1"}\n')

    const nhs = releaseFamily('nhs')
    const published = member('packages/core/published', '@noharness/published')
    const { planned } = planShared(nhs, root, [published], '0.0.2')

    expect(planned.map(entry => ({ path: entry.manifestPath, tag: entry.tag }))).toEqual([
      { path: 'package.json', tag: undefined },
      { path: 'packages/core/published/package.json', tag: 'nhs-v0.0.2' },
      { path: 'apps/desktop/package.json', tag: undefined },
      { path: 'packages/experimental/prototype/package.json', tag: undefined },
    ])
  })

  it.each(['0.0.2-alpha.1', '0.0.2-canary.1', '0.0.2-rc.1'])(
    'accepts the explicit nhs prerelease version %s',
    (version) => {
      const root = mkdtempSync(join(tmpdir(), 'nhs-release-prerelease-'))
      roots.push(root)
      write(join(root, 'package.json'), '{"version":"0.0.1"}\n')

      const nhs = releaseFamily('nhs')
      const published = member('packages/core/published', '@noharness/published')
      const plan = planShared(nhs, root, [published], version)

      expect(plan.version).toBe(version)
      expect(plan.planned[1]?.tag).toBe(`nhs-v${version}`)
    },
  )

  it('names one tag for the whole nhs family and one per vendored package', () => {
    const nhs = releaseFamily('nhs')
    const vendor = releaseFamily('vendor')
    const cli = member('apps/cli', '@noharness/cli')
    const cordis = { ...member('vendor/cordis', '@noharness/cordis'), version: '4.0.1' }

    expect(nhs.tagFor(cli)).toBe('nhs-v0.0.1')
    expect(vendor.tagFor(cordis)).toBe('vendor-cordis-v4.0.1')
    // The prefix is constructed, not recovered from a tag: a version with a
    // hyphen would defeat any suffix-stripping.
    expect(vendor.tagPrefixFor({ ...cordis, version: '4.0.0-rc.7' })).toBe('vendor-cordis-v')
    expect(vendor.tagFor({ ...cordis, version: '4.0.0-rc.7' })).toBe('vendor-cordis-v4.0.0-rc.7')
  })

  it('assigns alpha and canary dist-tags only to nhs releases', () => {
    const nhs = releaseFamily('nhs')
    const vendor = releaseFamily('vendor')

    expect(nhs.distTagForVersion('0.0.2-alpha.1')).toBe('alpha')
    expect(nhs.distTagForVersion('0.0.2-canary.1')).toBe('canary')
    expect(nhs.distTagForVersion('0.0.2-rc.1')).toBe('next')
    expect(nhs.distTagForVersion('0.0.2')).toBeUndefined()
    expect(vendor.distTagForVersion('4.0.1-alpha.1')).toBe('next')
    expect(vendor.distTagForVersion('4.0.1-canary.1')).toBe('next')
  })

  it('rejects a family whose members disagree on the shared version', () => {
    const nhs = releaseFamily('nhs')
    const members = [member('apps/cli', '@noharness/cli'), { ...member('apps/web', '@noharness/web-frontend'), version: '0.0.2' }]

    expect(() => { nhs.verifyVersions(members) }).toThrow(/must share one version/)
    expect(() => { nhs.verifyVersions([members[0]!]) }).not.toThrow()
  })

  it('accepts independent vendored versions and rejects an unpublishable one', () => {
    const vendor = releaseFamily('vendor')
    const members = [
      { ...member('vendor/cordis', '@noharness/cordis'), version: '4.0.1' },
      { ...member('vendor/cosmokit', '@noharness/cosmokit'), version: '1.8.2' },
    ]

    expect(() => { vendor.verifyVersions(members) }).not.toThrow()
    expect(() => { vendor.verifyVersions([{ ...members[0]!, version: 'latest' }]) }).toThrow(/unpublishable version/)
  })

  it('requires a current official client build only for nhs artifacts', () => {
    const nhs = releaseFamily('nhs')
    const vendor = releaseFamily('vendor')
    const officialEnvironment = officialClientBuildEnvironment(resolve(import.meta.dirname, '../..'))
    vi.stubEnv('NHS_CLIENT_COMMIT_HASH', officialEnvironment.NHS_CLIENT_COMMIT_HASH)
    const official = buildFixture(officialEnvironment)
    const defaultBuild = buildFixture({})
    const missing = join(defaultBuild, 'missing')
    write(join(missing, 'package.json'), `${JSON.stringify({ version: officialEnvironment.NHS_CLIENT_VERSION })}\n`)

    expect(() => { nhs.verifyBuildArtifacts(official) }).not.toThrow()
    expect(() => { nhs.verifyBuildArtifacts(defaultBuild) }).toThrow(/NHS_CLIENT_TITLE/)
    expect(() => { nhs.verifyBuildArtifacts(missing) }).toThrow(/record.*missing/)
    expect(() => { vendor.verifyBuildArtifacts(missing) }).not.toThrow()

    write(join(official, 'packages/client/example/lib/client.js'), 'module.exports = { changed: true }\n')
    expect(() => { nhs.verifyBuildArtifacts(official) }).toThrow(/artifacts differ/)
  })

  it('publishes a dependency before its consumer, and orders ties by name', () => {
    const nhs = releaseFamily('nhs')
    const members = [
      member('packages/a/consumer', '@noharness/consumer', { dependencies: { '@noharness/library': 'workspace:^' } }),
      member('packages/a/library', '@noharness/library'),
      member('packages/a/zebra', '@noharness/zebra'),
    ]

    expect(nhs.publishOrder(members).order.map(entry => entry.name)).toEqual([
      '@noharness/library',
      '@noharness/consumer',
      '@noharness/zebra',
    ])
  })

  it('publishes on-demand catalog members before nhs without adding installed dependencies', () => {
    const nhs = member('apps/cli', '@noharness/cli')
    const providers = ON_DEMAND_BUNDLES.map(name => member(`packages/subagent/${name}`, name))
    const plan = releaseFamily('nhs').publishOrder([nhs, ...providers])
    expect(plan.order.map(entry => entry.name)).toEqual([...ON_DEMAND_BUNDLES.toSorted(), nhs.name])
    expect(nhs.manifest).toEqual({})
    expect(plan.droppedPeerEdges).toEqual([])
  })

  it('rejects an advertised provider missing from the public release family', () => {
    expect(() => releaseFamily('nhs').publishOrder([member('apps/cli', '@noharness/cli')]))
      .toThrow('Official catalog prerequisite')
  })

  it('keeps catalog prerequisites ahead of a nhs peer declaration', () => {
    const nhs = member('apps/cli', '@noharness/cli')
    const providers = ON_DEMAND_BUNDLES.map(name => member(`packages/subagent/${name}`, name, {
      peerDependencies: { '@noharness/cli': 'workspace:*' },
    }))
    const plan = releaseFamily('nhs').publishOrder([nhs, ...providers])
    expect(plan.order.map(entry => entry.name)).toEqual([...ON_DEMAND_BUNDLES.toSorted(), nhs.name])
    expect(plan.droppedPeerEdges).toEqual(ON_DEMAND_BUNDLES.toSorted().map(name => ({ consumer: name, peer: nhs.name })))
  })

  it.each(['dependencies', 'optionalDependencies', 'peerDependencies'])(
    'requires exact packed NHS %s while preserving external ranges', (section) => {
      const pkg = member('packages/example/provider', '@noharness/provider')
      const family = releaseFamily('nhs')
      const familyNames = new Set([pkg.name, '@noharness/tools'])
      const manifest = { name: pkg.name, version: pkg.version, [section]: { '@noharness/tools': pkg.version, external: '^4.0.0' } }
      expect(() => { family.validatePackedManifest(pkg, manifest, familyNames) }).not.toThrow()
      for (const range of ['workspace:*', '^0.0.1', '~0.0.1', '0.0.2', '*']) {
        expect(() => { family.validatePackedManifest(pkg, { ...manifest, [section]: { '@noharness/tools': range } }, familyNames) })
          .toThrow(`packed ${section}.@noharness/tools must equal`)
      }
    },
  )

  it('leaves a vendored dependency on its own version line', () => {
    const pkg = member('packages/example/provider', '@noharness/provider')
    const family = releaseFamily('nhs')
    const familyNames = new Set([pkg.name])
    expect(() => {
      family.validatePackedManifest(pkg, {
        name: pkg.name, version: pkg.version, peerDependencies: { '@noharness/cordis': '~4.1.0' },
      }, familyNames)
    }).not.toThrow()
  })

  it('checks packed identities and preserves independent vendor versions', () => {
    const pkg = member('vendor/example', '@noharness/example')
    const family = releaseFamily('vendor')
    const familyNames = new Set([pkg.name])
    expect(() => { family.validatePackedManifest(pkg, { name: pkg.name, version: pkg.version, dependencies: { '@noharness/tools': '^4.0.0' } }, familyNames) })
      .not.toThrow()
    expect(() => { family.validatePackedManifest(pkg, { name: '@noharness/other', version: pkg.version }, familyNames) }).toThrow('packed identity')
    expect(() => { family.validatePackedManifest(pkg, { name: pkg.name, version: '0.0.2' }, familyNames) }).toThrow('packed identity')
  })

  it('reports a runtime dependency cycle instead of emitting an arbitrary order', () => {
    const nhs = releaseFamily('nhs')
    const members = [
      member('packages/a/left', '@noharness/left', { dependencies: { '@noharness/right': 'workspace:^' } }),
      member('packages/a/right', '@noharness/right', { dependencies: { '@noharness/left': 'workspace:^' } }),
    ]

    expect(() => { nhs.publishOrder(members) }).toThrow(/dependency cycle/)
  })

  it('publishes a peer before its consumer', () => {
    const nhs = releaseFamily('nhs')
    const members = [
      member('packages/a/consumer', '@noharness/consumer', { peerDependencies: { '@noharness/zebra': 'workspace:^' } }),
      member('packages/a/zebra', '@noharness/zebra'),
    ]

    // Name order alone would place the consumer first; the peer edge moves it.
    expect(nhs.publishOrder(members).order.map(entry => entry.name)).toEqual([
      '@noharness/zebra',
      '@noharness/consumer',
    ])
  })

  it('orders around a peer cycle rather than refusing to publish, and reports the edge it dropped', () => {
    const nhs = releaseFamily('nhs')
    const members = [
      member('packages/a/left', '@noharness/left', { peerDependencies: { '@noharness/right': 'workspace:^' } }),
      member('packages/a/right', '@noharness/right', { peerDependencies: { '@noharness/left': 'workspace:^' } }),
    ]

    // Sibling packages declare each other as peers, and npm treats an unmet peer
    // as a warning, so this pair has to publish rather than fail the release.
    const plan = nhs.publishOrder(members)
    expect(plan.order.map(entry => entry.name)).toEqual([
      '@noharness/right',
      '@noharness/left',
    ])
    // One of the two edges has to give, and which one it is belongs in the log.
    expect(plan.droppedPeerEdges).toEqual([
      { consumer: '@noharness/right', peer: '@noharness/left' },
    ])
  })

  it('honours an install edge even when a peer cycle surrounds it', () => {
    const nhs = releaseFamily('nhs')
    const members = [
      member('packages/a/base', '@noharness/base', { peerDependencies: { '@noharness/consumer': 'workspace:^' } }),
      member('packages/a/consumer', '@noharness/consumer', {
        dependencies: { '@noharness/base': 'workspace:^' },
        peerDependencies: { '@noharness/base': 'workspace:^' },
      }),
    ]

    // The install edge is absolute: base publishes first, and the peer edge that
    // would reverse it is the one dropped.
    const plan = nhs.publishOrder(members)
    expect(plan.order.map(entry => entry.name)).toEqual([
      '@noharness/base',
      '@noharness/consumer',
    ])
    expect(plan.droppedPeerEdges).toEqual([
      { consumer: '@noharness/base', peer: '@noharness/consumer' },
    ])
  })

  it('refuses an order that would publish a consumer before a dependency it installs', () => {
    const nhs = releaseFamily('nhs')
    const members = [
      member('packages/a/alpha', '@noharness/alpha', { peerDependencies: { '@noharness/bravo': 'workspace:^' } }),
      member('packages/a/bravo', '@noharness/bravo', { peerDependencies: { '@noharness/charlie': 'workspace:^' } }),
      member('packages/a/charlie', '@noharness/charlie', { dependencies: { '@noharness/alpha': 'workspace:^' } }),
    ]

    // A cycle of two peer edges closed by one install edge: dropping a peer edge
    // would order this, and the traversal drops the install edge instead. That
    // order would publish charlie before the alpha it installs, so it is refused
    // here rather than published.
    expect(() => { nhs.publishOrder(members) }).toThrow(/no publish order honours @noharness\/charlie -> @noharness\/alpha/)
  })

  it('ignores devDependencies when ordering', () => {
    const nhs = releaseFamily('nhs')
    const members = [
      member('packages/a/alpha', '@noharness/alpha', { devDependencies: { '@noharness/zebra': 'workspace:^' } }),
      member('packages/a/zebra', '@noharness/zebra'),
    ]

    // A dev dependency is absent from the published package, so it must not move
    // the consumer behind it.
    expect(nhs.publishOrder(members).order.map(entry => entry.name)).toEqual([
      '@noharness/alpha',
      '@noharness/zebra',
    ])
  })

  it('accepts the harness payload and keeps upstream payloads for vendored packages', () => {
    const nhs = releaseFamily('nhs')
    const vendor = releaseFamily('vendor')
    const harness = member('packages/a/library', '@noharness/library')
    const vendored = member('vendor/cordis', '@noharness/cordis')

    expect(() => { nhs.validatePayload(harness, ['package/lib/index.js', 'package/lib/index.js.map', 'package/src/index.ts']) }).not.toThrow()
    expect(() => { vendor.validatePayload(vendored, ['package/lib/index.js', 'package/src/index.ts']) }).not.toThrow()
    expect(() => { vendor.validatePayload(vendored, []) }).toThrow(/empty tarball/)
  })

  it('requires the installed package payload the staging hook supplies', () => {
    const nhs = releaseFamily('nhs')
    const installed = member('apps/cli', '@noharness/cli')

    expect(() => { nhs.validatePayload(installed, ['package/lib/index.js', 'package/src/bin.ts']) })
      .toThrow(/@noharness\/cli packed no documentation/)
    expect(() => { nhs.validatePayload(installed, ['package/lib/index.js', 'package/docs/guide.md', 'package/src/bin.ts']) })
      .toThrow(/@noharness\/cli packed no upgrade guide index/)
    const docs = ['package/docs/guide.md', 'package/docs/upgrade-guide/README.md']
    expect(() => { nhs.validatePayload(installed, ['package/lib/index.js', ...docs]) })
      .toThrow(/@noharness\/cli packed no source/)
    expect(() => { nhs.validatePayload(installed, ['package/lib/index.js', ...docs, 'package/src/bin.ts']) })
      .not.toThrow()
  })

  it('drives the installed entry only for the family that publishes one', () => {
    expect(releaseFamily('nhs').installedEntry).toEqual({ packageName: '@noharness/cli', binPath: 'lib/bin.js' })
    expect(releaseFamily('vendor').installedEntry).toBeUndefined()
  })

  it('rejects an unknown family identifier', () => {
    expect(() => { releaseFamily('native') }).toThrow(/unknown release family/)
  })
})

describe('vendored version baseline', () => {
  it('drops an upstream prerelease segment and increments the patch', () => {
    expect(nextVendorVersion('4.0.0-rc.7', undefined)).toBe('4.0.1')
    expect(nextVendorVersion('1.0.0-rc.5', undefined)).toBe('1.0.1')
    expect(nextVendorVersion('1.8.1', undefined)).toBe('1.8.2')
  })

  it('increments from the last published version when a re-sync restored a lower one', () => {
    // Upstream moved rc.7 -> rc.8 after this repository published 4.0.1;
    // incrementing the manifest alone would name 4.0.1 a second time.
    expect(nextVendorVersion('4.0.0-rc.8', '4.0.1')).toBe('4.0.2')
    expect(nextVendorVersion('4.1.0', '4.0.1')).toBe('4.1.1')
  })

  it('appends a rehearsal prerelease without consuming its release numbers', () => {
    // A rehearsal burns 4.0.1-rc.1 and leaves 4.0.1 free, so the stable release
    // that follows takes those same numbers instead of skipping to 4.0.2.
    expect(nextVendorVersion('4.0.0-rc.7', undefined, 'rc.1')).toBe('4.0.1-rc.1')
    expect(nextVendorVersion('4.0.0-rc.7', '4.0.1-rc.1', 'rc.2')).toBe('4.0.1-rc.2')
    expect(nextVendorVersion('4.0.0-rc.7', '4.0.1-rc.1')).toBe('4.0.1')
    expect(nextVendorVersion('4.0.0-rc.7', '4.0.1')).toBe('4.0.2')
  })
})

describe('version precedence', () => {
  it('orders alpha, canary, and release-candidate versions by semver precedence', () => {
    expect(compareVersions('4.0.1-alpha.1', '4.0.1-canary.1')).toBeLessThan(0)
    expect(compareVersions('4.0.1-canary.1', '4.0.1-rc.1')).toBeLessThan(0)
    expect(compareVersions('4.0.1-rc.1', '4.0.1')).toBeLessThan(0)
  })

  it('ranks a release above the prerelease it follows', () => {
    // git --sort=v:refname disagrees, placing 4.0.1-rc.1 above 4.0.1, which is
    // why the newest published version is chosen here rather than by git.
    expect(compareVersions('4.0.1', '4.0.1-rc.1')).toBeGreaterThan(0)
    expect(compareVersions('4.0.1-rc.1', '4.0.1')).toBeLessThan(0)
  })

  it('compares numeric prerelease fields numerically', () => {
    expect(compareVersions('4.0.1-rc.10', '4.0.1-rc.1')).toBeGreaterThan(0)
    expect(compareVersions('4.0.1-rc.2', '4.0.1-rc.10')).toBeLessThan(0)
  })

  it('ranks a numeric field below an alphanumeric one, and a shorter list below a longer', () => {
    expect(compareVersions('4.0.1-1', '4.0.1-alpha')).toBeLessThan(0)
    expect(compareVersions('4.0.1-rc', '4.0.1-rc.1')).toBeLessThan(0)
    expect(compareVersions('4.0.2', '4.0.1')).toBeGreaterThan(0)
    expect(compareVersions('4.0.1-rc.1', '4.0.1-rc.1')).toBe(0)
  })
})

describe('payload change judgement', () => {
  const sourceShipping = member('vendor/cosmokit', '@noharness/cosmokit', {
    files: ['lib/index.js', 'lib/types/**/*.d.ts', 'src'],
  })
  const buildOutputOnly = member('vendor/cordis', '@noharness/cordis', {
    files: ['lib/index.js', 'lib/types/**/*.d.ts', 'bin.js'],
  })

  it('counts the manifest and the files npm always publishes', () => {
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/package.json')).toBe(true)
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/README.md')).toBe(true)
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/src/index.ts')).toBe(true)
  })

  it('counts build inputs for a package whose payload is build output', () => {
    // cordis publishes lib/ only, and lib/ is not tracked: without this, a real
    // source change reads as "nothing changed" and the next publish fails on a
    // version whose bytes moved.
    expect(reachesPayload(buildOutputOnly, 'vendor/cordis/src/context.ts')).toBe(true)
    expect(reachesPayload(buildOutputOnly, 'vendor/cordis/tsconfig.json')).toBe(true)
  })

  it('ignores paths no tarball carries', () => {
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/tests/unit.spec.ts')).toBe(false)
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/CHANGELOG.md')).toBe(false)
    // The README pattern is deliberately loose: over-reporting a change costs one
    // unnecessary patch bump, while under-reporting fails the next publish on a
    // version whose bytes moved.
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/README.i18n.yaml')).toBe(true)
    expect(reachesPayload(member('packages/a/library', '@noharness/library', { files: ['lib/index.js'] }),
      'packages/a/library/tests/library.spec.ts')).toBe(false)
  })
})
