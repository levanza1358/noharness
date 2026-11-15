import { describe, expect, it } from 'vitest'
import type { NpmPackageLock, RegistryIndex } from './benchmark-npm-resolution.ts'
import {
  assertDualDshInstallLayout,
  assertResolutionWorkBudget,
  buildDualDshRegistry,
  MAX_RESOLUTION_WORK_UNITS,
} from './verify-npm-install-layout.ts'

function validLayout(): NpmPackageLock {
  return {
    lockfileVersion: 3,
    packages: {
      '': { dependencies: { '@noharness/cli': '0.2.0', 'nhs-previous': 'npm:@noharness/cli@0.1.0' } },
      'node_modules/@noharness/cordis': { version: '4.0.1' },
      'node_modules/@noharness/cli': {
        version: '0.2.0',
        dependencies: { '@noharness/child': '^0.2.0' },
        peerDependencies: { '@noharness/cordis': '^4.0.1' },
      },
      'node_modules/@noharness/child': {
        version: '0.2.0',
        dependencies: { '@noharness/leaf': '^0.2.0' },
      },
      'node_modules/@noharness/leaf': { version: '0.2.0' },
      'node_modules/nhs-previous': {
        name: '@noharness/cli',
        version: '0.1.0',
        dependencies: { '@noharness/child': '^0.1.0' },
        peerDependencies: { '@noharness/cordis': '^4.0.1' },
      },
      'node_modules/nhs-previous/node_modules/@noharness/child': {
        version: '0.1.0',
        dependencies: { '@noharness/leaf': '^0.1.0' },
      },
      'node_modules/nhs-previous/node_modules/@noharness/leaf': { version: '0.1.0' },
    },
  }
}

describe('npm install layout verifier', () => {
  it('creates two incompatible versions of every NHS package', () => {
    const index: RegistryIndex = new Map([
      ['@noharness/cli', new Map([['0.1.1-rc.2', {
        name: '@noharness/cli',
        version: '0.1.1-rc.2',
        dependencies: { '@noharness/child': '^0.1.1-rc.2' },
        peerDependencies: { '@noharness/cordis': '^4.0.1' },
      }]])],
      ['@noharness/child', new Map([['0.1.1-rc.2', {
        name: '@noharness/child',
        version: '0.1.1-rc.2',
      }]])],
      ['@noharness/cordis', new Map([['4.0.1', {
        name: '@noharness/cordis',
        version: '4.0.1',
      }]])],
    ])

    const dual = buildDualDshRegistry(index, '0.1.1-rc.2')

    expect([...dual.get('@noharness/cli')?.keys() ?? []]).toEqual(['0.1.0', '0.2.0'])
    expect(dual.get('@noharness/cli')?.get('0.1.0')).toMatchObject({
      version: '0.1.0',
      dependencies: { '@noharness/child': '^0.1.0' },
      peerDependencies: { '@noharness/cordis': '^4.0.1' },
    })
    expect(dual.get('@noharness/cli')?.get('0.2.0')).toMatchObject({
      version: '0.2.0',
      dependencies: { '@noharness/child': '^0.2.0' },
    })
    expect(dual.get('@noharness/cordis')).toBe(index.get('@noharness/cordis'))
  })

  it('accepts isolated NHS releases with one shared Cordis installation', () => {
    expect(assertDualDshInstallLayout(validLayout())).toEqual({
      nhsPackagesPerVersion: 3,
      checkedDshEdges: 4,
    })
  })

  it.each([
    ['react', 'node_modules/react'],
    ['react-dom', 'node_modules/react-dom'],
    ['react', 'node_modules/nhs-previous/node_modules/react'],
    ['react-dom', 'node_modules/nhs-previous/node_modules/react-dom'],
  ])('rejects browser runtime %s installed at %s in the NHS-only consumer', (name, path) => {
    const layout = validLayout()
    const packages = { ...layout.packages, [path]: { version: '18.3.1' } }
    expect(() => assertDualDshInstallLayout({ ...layout, packages })).toThrow(
      `${path}: ${name} is a browser build input`,
    )
  })

  it('rejects an internal edge that crosses release versions', () => {
    const layout = validLayout()
    const packages = { ...layout.packages }
    Reflect.deleteProperty(packages, 'node_modules/nhs-previous/node_modules/@noharness/leaf')

    expect(() => assertDualDshInstallLayout({ ...layout, packages })).toThrow(
      'node_modules/nhs-previous/node_modules/@noharness/child: dependencies '
      + '@noharness/leaf resolves to node_modules/@noharness/leaf@0.2.0, expected 0.1.0',
    )
  })

  it('rejects a second Cordis installation', () => {
    const layout = validLayout()
    const packages = {
      ...layout.packages,
      'node_modules/nhs-previous/node_modules/@noharness/cordis': { version: '4.0.1' },
    }

    expect(() => assertDualDshInstallLayout({ ...layout, packages })).toThrow(
      'expected one shared @noharness/cordis',
    )
  })
})

describe('resolution work budget', () => {
  it.each([
    [277, 2524, 699_148],
    [316, 2780, 878_480],
    [316, 2786, 880_376],
    [317, 2786, 883_162],
    [320, 2836, 907_520],
  ])('accepts the measured dual-release graph with %i packages and %i edges', (packages, edges, units) => {
    expect(assertResolutionWorkBudget({ nhsPackagesPerVersion: packages, checkedDshEdges: edges }))
      .toBe(units)
  })

  it('accepts a graph exactly at the budget and rejects one internal edge above it', () => {
    const packages = 320
    const edgesAtBudget = Math.floor(MAX_RESOLUTION_WORK_UNITS / packages)

    expect(packages * edgesAtBudget).toBe(MAX_RESOLUTION_WORK_UNITS)
    expect(assertResolutionWorkBudget({ nhsPackagesPerVersion: packages, checkedDshEdges: edgesAtBudget }))
      .toBe(MAX_RESOLUTION_WORK_UNITS)
    expect(() => assertResolutionWorkBudget({
      nhsPackagesPerVersion: packages,
      checkedDshEdges: edgesAtBudget + 1,
    })).toThrow(`= ${String(MAX_RESOLUTION_WORK_UNITS + packages)} unit(s), budget ${String(MAX_RESOLUTION_WORK_UNITS)} unit(s)`)
  })

  it('accepts the headroom and rejects a runaway graph with its own measured counts', () => {
    expect(assertResolutionWorkBudget({ nhsPackagesPerVersion: 350, checkedDshEdges: 3200 }))
      .toBe(1_120_000)
    expect(() => assertResolutionWorkBudget({ nhsPackagesPerVersion: 400, checkedDshEdges: 3000 }))
      .toThrow(`400 package(s) per release x 3000 internal edge(s) = 1200000 unit(s), budget ${String(MAX_RESOLUTION_WORK_UNITS)} unit(s)`)
  })
})
