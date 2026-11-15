import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AGENTS_HOME_DIR_NAME,
  DEFAULT_AGENTS_HOME_DISPLAY,
  DEFAULT_NHS_HOME_DISPLAY,
  NHS_HOME_DIR_NAME,
  agentsHomeDisplay,
  canonicalizeWatchPath,
  defaultAgentsHome,
  defaultDshHome,
  nhsCachePath,
  nhsHomeDisplay,
  nhsHomePath,
  nhsPath,
  expandHomePath,
  resolveAgentsHome,
  resolveDshHome,
} from '@noharness/home-paths'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('nhs path helpers', () => {
  it('owns the shared default NHS home directory name', () => {
    expect(NHS_HOME_DIR_NAME).toBe('.nhs')
    expect(DEFAULT_NHS_HOME_DISPLAY).toBe('~/.nhs')
    expect(defaultDshHome()).toBe(join(homedir(), '.nhs'))
  })

  it('expands tilde paths without changing non-tilde paths', () => {
    expect(expandHomePath('~')).toBe(homedir())
    expect(expandHomePath('~/.nhs')).toBe(join(homedir(), '.nhs'))
    expect(expandHomePath('~\\.nhs')).toBe(join(homedir(), '.nhs'))
    expect(expandHomePath('/tmp/.nhs')).toBe('/tmp/.nhs')
    expect(expandHomePath('~other/.nhs')).toBe('~other/.nhs')
  })

  it('resolves explicit path before NHS_HOME and the default', () => {
    const envHome = join(homedir(), 'env-nhs')

    expect(resolveDshHome('/tmp/explicit-nhs', { NHS_HOME: '~/env-nhs' })).toBe(resolve('/tmp/explicit-nhs'))
    expect(resolveDshHome(undefined, { NHS_HOME: '~/env-nhs' })).toBe(envHome)
    expect(resolveDshHome(undefined, {})).toBe(defaultDshHome())
  })

  it('treats an empty or whitespace-only NHS_HOME as unset', () => {
    expect(resolveDshHome(undefined, { NHS_HOME: '' })).toBe(defaultDshHome())
    expect(resolveDshHome(undefined, { NHS_HOME: '   ' })).toBe(defaultDshHome())
  })

  it('joins child segments onto the resolved NHS_HOME', () => {
    vi.stubEnv('NHS_HOME', '~/env-nhs')
    expect(nhsHomePath()).toBe(join(homedir(), 'env-nhs'))
    expect(nhsHomePath('storages', 'cache')).toBe(join(homedir(), 'env-nhs', 'storages', 'cache'))
  })

  it('labels a resolved home by whether it is the default root', () => {
    expect(nhsHomeDisplay(resolve(defaultDshHome()))).toBe('~/.nhs')
    expect(nhsHomeDisplay('/some/other/root')).toBe('$NHS_HOME')
  })

  it('owns the shared default agents home directory name', () => {
    expect(AGENTS_HOME_DIR_NAME).toBe('.agents')
    expect(DEFAULT_AGENTS_HOME_DISPLAY).toBe('~/.agents')
    expect(defaultAgentsHome()).toBe(join(homedir(), '.agents'))
  })

  it('resolves an explicit agents home before NHS_AGENTS_HOME and the default', () => {
    const envHome = join(homedir(), 'env-agents')

    expect(resolveAgentsHome('/tmp/explicit-agents', { NHS_AGENTS_HOME: '~/env-agents' })).toBe(resolve('/tmp/explicit-agents'))
    expect(resolveAgentsHome(undefined, { NHS_AGENTS_HOME: '~/env-agents' })).toBe(envHome)
    expect(resolveAgentsHome(undefined, {})).toBe(defaultAgentsHome())
  })

  it('treats an empty or whitespace-only NHS_AGENTS_HOME as unset', () => {
    expect(resolveAgentsHome(undefined, { NHS_AGENTS_HOME: '' })).toBe(defaultAgentsHome())
    expect(resolveAgentsHome(undefined, { NHS_AGENTS_HOME: '   ' })).toBe(defaultAgentsHome())
  })

  it('labels a resolved agents home by whether it is the default root', () => {
    expect(agentsHomeDisplay(resolve(defaultAgentsHome()))).toBe('~/.agents')
    expect(agentsHomeDisplay('/some/other/root')).toBe('$NHS_AGENTS_HOME')
  })

  it.each([
    [undefined, join(homedir(), '.nhs')],
    ['', join(homedir(), '.nhs')],
    ['   ', join(homedir(), '.nhs')],
    ['~/env-nhs', join(homedir(), 'env-nhs')],
    ['./relative-nhs', resolve('./relative-nhs')],
  ] as const)('resolves cache paths with NHS_HOME=%j', (home, expectedHome) => {
    vi.stubEnv('NHS_HOME', home)
    try {
      expect(nhsCachePath()).toBe(join(expectedHome, 'cache'))
      expect(nhsCachePath('models', 'index.json')).toBe(join(expectedHome, 'cache', 'models', 'index.json'))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('resolves configured cache homes before the environment', () => {
    vi.stubEnv('NHS_HOME', '~/env-nhs')
    try {
      expect(nhsCachePath({ nhsHome: '~/explicit-nhs' })).toBe(join(homedir(), 'explicit-nhs', 'cache'))
      expect(nhsCachePath({ nhsHome: './explicit-nhs' }, 'attachments', 'request-images'))
        .toBe(resolve('./explicit-nhs/cache/attachments/request-images'))
      expect(nhsCachePath({}, 'attachments')).toBe(join(homedir(), 'env-nhs', 'cache', 'attachments'))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it.each([
    [undefined, join(homedir(), '.nhs')],
    ['', join(homedir(), '.nhs')],
    ['~/env-nhs', join(homedir(), 'env-nhs')],
    ['./relative-nhs', resolve('./relative-nhs')],
  ] as const)('resolves category paths with NHS_HOME=%j', (home, expectedHome) => {
    vi.stubEnv('NHS_HOME', home)
    for (const category of ['config', 'data', 'state', 'cache', 'backup'] as const) {
      expect(nhsPath(category)).toBe(join(expectedHome, category))
      expect(nhsPath(category, 'owner', 'file.json')).toBe(join(expectedHome, category, 'owner', 'file.json'))
    }
  })

  it('resolves a configured category home before the environment', () => {
    vi.stubEnv('NHS_HOME', '~/env-nhs')
    expect(nhsPath({ category: 'state', nhsHome: '~/explicit-nhs' }, 'logs')).toBe(join(homedir(), 'explicit-nhs', 'state', 'logs'))
    expect(nhsPath({ category: 'data', nhsHome: undefined })).toBe(join(homedir(), 'env-nhs', 'data'))
  })

  it('canonicalizes a watcher ancestor while preserving a missing suffix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'nhs-watch-path-'))
    const target = join(root, 'target')
    const alias = join(root, 'alias')
    try {
      await mkdir(target)
      await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
      await expect(canonicalizeWatchPath(alias)).resolves.toBe(await realpath(target))
      await expect(canonicalizeWatchPath(join(alias, 'later', 'config.yml'))).resolves.toBe(
        join(await realpath(target), 'later', 'config.yml'),
      )
      const file = join(root, 'file')
      await writeFile(file, 'not a directory')
      await expect(canonicalizeWatchPath(join(file, 'child'))).rejects.toMatchObject({ code: 'ENOTDIR' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
