import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { inspectDshPackageLicenses } from './verify-nhs-package-licenses.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function writeManifest(root: string, file: string, manifest: Record<string, unknown>): void {
  const path = join(root, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`)
}

function createWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'nhs-package-licenses-'))
  roots.push(root)
  writeManifest(root, 'package.json', {
    name: '@noharness/root',
    license: 'MIT',
    workspaces: ['apps/*', 'packages/*/*', 'vendor/*'],
  })
  return root
}

describe('NHS package license gate', () => {
  it('checks every @noharness package and ignores other scopes', () => {
    const root = createWorkspace()
    writeManifest(root, 'apps/cli/package.json', { name: '@noharness/cli', license: 'MIT' })
    writeManifest(root, 'packages/core/agent/package.json', {
      name: '@noharness/agent',
      license: 'BSD-3-Clause',
    })
    writeManifest(root, 'vendor/cordis/package.json', { name: '@noharness/cordis', license: 'MIT' })
    writeManifest(root, 'vendor/other/package.json', { name: '@other/thing', license: 'BSD-3-Clause' })

    expect(inspectDshPackageLicenses(root)).toEqual({
      packageCount: 4,
      failures: [
        'packages/core/agent/package.json: @noharness/agent must declare "license": "MIT"; found "BSD-3-Clause".',
      ],
    })
  })

  it('rejects a missing license declaration', () => {
    const root = createWorkspace()
    writeManifest(root, 'packages/core/agent/package.json', { name: '@noharness/agent' })

    expect(inspectDshPackageLicenses(root).failures).toEqual([
      'packages/core/agent/package.json: @noharness/agent must declare "license": "MIT"; found undefined.',
    ])
  })
})
