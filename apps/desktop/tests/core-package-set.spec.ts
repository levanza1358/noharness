import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DESKTOP_PACKAGES_DIR,
  DESKTOP_PACKAGE_SET_FILE,
  desktopCorePackageOverrides,
  desktopDshPackageSpec,
  parseDesktopCorePackageSet,
  verifyDesktopCoreLockfile,
  verifyDesktopCorePackageSet,
  type DesktopCorePackageRecord,
} from '../src/core-package-set.ts'

const roots: string[] = []

function record(name: string, file: string, body: Buffer, version = '1.2.3'): DesktopCorePackageRecord {
  return {
    name,
    version,
    file,
    bytes: body.byteLength,
    integrity: `sha512-${createHash('sha512').update(body).digest('base64')}`,
  }
}

function packageSetProject(): {
  root: string
  nhs: DesktopCorePackageRecord
  host: DesktopCorePackageRecord
} {
  const root = mkdtempSync(join(tmpdir(), 'nhs-desktop-package-set-'))
  roots.push(root)
  const packageDir = join(root, DESKTOP_PACKAGES_DIR)
  mkdirSync(packageDir)
  const nhsBody = Buffer.from('nhs')
  const hostBody = Buffer.from('host')
  const nhs = record('@noharness/nhs', 'nhs.tgz', nhsBody)
  const host = record('@noharness/nhs-desktop-host', 'nhs-desktop-host.tgz', hostBody)
  writeFileSync(join(packageDir, nhs.file), nhsBody)
  writeFileSync(join(packageDir, host.file), hostBody)
  writeFileSync(join(root, DESKTOP_PACKAGE_SET_FILE), `${JSON.stringify({
    schemaVersion: 1,
    packages: [nhs, host],
  })}\n`)
  return { root, nhs, host }
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('desktop core package set', () => {
  it('pins the direct nhs dependency and every internal package to local tarballs', () => {
    const { root } = packageSetProject()
    const packageSet = verifyDesktopCorePackageSet(root, '1.2.3')
    expect(desktopDshPackageSpec(packageSet)).toBe('file:./desktop-packages/nhs.tgz')
    expect(desktopCorePackageOverrides(packageSet)).toEqual({
      '@noharness/nhs': 'file:./desktop-packages/nhs.tgz',
      '@noharness/nhs-desktop-host': 'file:./desktop-packages/nhs-desktop-host.tgz',
    })
  })

  it('rejects version drift, descriptor disorder, corruption, and extra files', () => {
    const { root, nhs, host } = packageSetProject()
    expect(() => parseDesktopCorePackageSet({ schemaVersion: 1, packages: [host, nhs] }))
      .toThrow(/sorted by name/u)
    expect(() => parseDesktopCorePackageSet({
      schemaVersion: 1,
      packages: [nhs, { ...host, version: '2.0.0' }],
    }, '1.2.3')).toThrow(/@noharness\/nhs-desktop-host@2\.0\.0 does not match Desktop 1\.2\.3/u)
    expect(() => verifyDesktopCorePackageSet(root, '2.0.0')).toThrow(/does not match Desktop/u)
    writeFileSync(join(root, DESKTOP_PACKAGES_DIR, nhs.file), 'changed')
    expect(() => verifyDesktopCorePackageSet(root, '1.2.3')).toThrow(/integrity check failed/u)
    writeFileSync(join(root, DESKTOP_PACKAGES_DIR, 'extra.tgz'), '')
    expect(() => verifyDesktopCorePackageSet(root, '1.2.3')).toThrow(/does not match its descriptor/u)
  })

  it('rejects registry resolutions for names supplied by the local package set', () => {
    const nhs = record('@noharness/nhs', 'nhs.tgz', Buffer.from('nhs'))
    const host = record('@noharness/nhs-desktop-host', 'host.tgz', Buffer.from('host'))
    const packageSet = parseDesktopCorePackageSet({ schemaVersion: 1, packages: [nhs, host] })
    expect(() => {
      verifyDesktopCoreLockfile(
        "packages:\n  '@noharness/nhs@file:desktop-packages/nhs.tgz':\n    resolution: {}\n",
        packageSet,
      )
    }).not.toThrow()
    expect(() => {
      verifyDesktopCoreLockfile(
        "packages:\n  '@noharness/nhs@1.2.3':\n    resolution: {integrity: sha512-registry}\n",
        packageSet,
      )
    }).toThrow(/outside the local package set/u)
  })
})
