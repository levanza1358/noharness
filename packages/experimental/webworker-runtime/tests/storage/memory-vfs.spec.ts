/**
 * The identity, timestamp, link, mutation, and durability-sink guarantees
 * MemoryVfs owes its consumers, asserted directly rather than through the
 * `node:fs` bridge.
 *
 * `nhs-fs-local` builds a version token from `dev:ino:size:mtimeNs:ctimeNs` and
 * refuses a write whose token moved since it read. Two properties carry that:
 * `ino` identifies the entry at a path, and `mtimeMs` moves on every write. The
 * timestamp cases freeze the clock, because these writes are in memory and two
 * revisions routinely land in the same millisecond — a real-clock test passes
 * whether or not the strict increment exists.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryVfs } from '../../src/storage/memory.ts'
import type { VfsBigIntStats, VfsMutation, VfsMutationSink, VfsStats } from '../../src/storage/types.ts'

const identity = (vfs: MemoryVfs, path: string): bigint =>
  (vfs.statSync(path, { bigint: true }) as VfsBigIntStats).ino

const linkCount = (vfs: MemoryVfs, path: string): bigint =>
  (vfs.statSync(path, { bigint: true }) as VfsBigIntStats).nlink

const modified = (vfs: MemoryVfs, path: string): number => (vfs.statSync(path) as VfsStats).mtimeMs

afterEach(() => { vi.restoreAllMocks() })

describe('entry identity', () => {
  it('distinguishes paths and holds each identity across repeated stats', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/one.txt', 'one')
    vfs.seed('/nhs/two.txt', 'two')
    const first = identity(vfs, '/nhs/one.txt')
    expect(identity(vfs, '/nhs/two.txt')).not.toBe(first)
    expect(identity(vfs, '/nhs/one.txt')).toBe(first)
  })

  it('forgets the identities under a directory removed as a subtree', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/skills/git/SKILL.md', '# git\n')
    const before = identity(vfs, '/nhs/skills/git/SKILL.md')
    vfs.rmSync('/nhs/skills', { recursive: true })
    vfs.seed('/nhs/skills/git/SKILL.md', '# git rebuilt\n')
    expect(identity(vfs, '/nhs/skills/git/SKILL.md')).not.toBe(before)
  })

  it('moves the source identity when a file replaces another path', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/from.txt', 'moved')
    vfs.seed('/nhs/to.txt', 'replaced')
    const [source, destination] = [identity(vfs, '/nhs/from.txt'), identity(vfs, '/nhs/to.txt')]
    vfs.renameSync('/nhs/from.txt', '/nhs/to.txt')
    const renamed = identity(vfs, '/nhs/to.txt')
    expect(vfs.readFileSync('/nhs/to.txt', 'utf8')).toBe('moved')
    expect([renamed === source, renamed === destination]).toEqual([true, false])
  })
})

describe('modification time', () => {
  it('hydrates explicit metadata without confusing timestamps with permission bits', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/restored', 'value', { mode: 0o600, mtimeMs: 1_600_000_000_000 })
    vfs.seedDirectory('/nhs/restored-directory', { mode: 0o700, mtimeMs: 1_600_000_000_001 })
    const stats = vfs.statSync('/nhs/restored') as VfsStats
    const directory = vfs.statSync('/nhs/restored-directory') as VfsStats
    expect([stats.mode & 0o777, stats.mtimeMs]).toEqual([0o600, 1_600_000_000_000])
    expect([directory.mode & 0o777, directory.mtimeMs]).toEqual([0o700, 1_600_000_000_001])
  })

  it('advances on every write even while the clock stands still', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/log.jsonl', 'first\n')
    const seeded = modified(vfs, '/nhs/log.jsonl')
    vfs.writeFileSync('/nhs/log.jsonl', 'second\n')
    const written = modified(vfs, '/nhs/log.jsonl')
    vfs.appendFileSync('/nhs/log.jsonl', 'third\n')
    const appended = modified(vfs, '/nhs/log.jsonl')
    vfs.truncateSync('/nhs/log.jsonl', 6)
    const truncated = modified(vfs, '/nhs/log.jsonl')
    expect([written > seeded, appended > written, truncated > appended]).toEqual([true, true, true])
    // One millisecond per revision: the increment is the minimum that separates
    // two tokens, not a coarser bump that would skew a real timestamp.
    expect(truncated - seeded).toBe(3)
  })

  it('takes the clock once the clock has passed the entry', () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/log.jsonl', 'first\n')
    clock.mockReturnValue(1_700_000_005_000)
    vfs.writeFileSync('/nhs/log.jsonl', 'second\n')
    expect(modified(vfs, '/nhs/log.jsonl')).toBe(1_700_000_005_000)
  })

  it('extends truncation with zero bytes', async () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/file', new Uint8Array([1, 2]))
    vfs.truncateSync('/nhs/file', 5)
    expect([...vfs.readFileSync('/nhs/file') as Uint8Array]).toEqual([1, 2, 0, 0, 0])
    const handle = vfs.open('/nhs/file', 'r+')
    await handle.truncate(7)
    expect([...vfs.readFileSync('/nhs/file') as Uint8Array]).toEqual([1, 2, 0, 0, 0, 0, 0])
  })

  it('advances a directory only when its immediate entry set changes', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/nhs/workspace')
    const empty = modified(vfs, '/nhs/workspace')
    vfs.writeFileSync('/nhs/workspace/file.txt', 'one')
    const created = modified(vfs, '/nhs/workspace')
    vfs.writeFileSync('/nhs/workspace/file.txt', 'two')
    const rewritten = modified(vfs, '/nhs/workspace')
    vfs.rmSync('/nhs/workspace/file.txt')
    const removed = modified(vfs, '/nhs/workspace')
    expect([created > empty, rewritten === created, removed > rewritten]).toEqual([true, true, true])
  })
})

describe('mutation publication', () => {
  it('publishes only committed runtime changes and keeps image seeding silent', () => {
    const vfs = new MemoryVfs()
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })
    vfs.seed('/nhs/seeded.txt', 'seeded')
    expect(mutations).toEqual([])
    vfs.writeFileSync('/nhs/seeded.txt', 'changed')
    vfs.mkdirSync('/nhs/created')
    vfs.chmodSync('/nhs/created', 0o700)
    vfs.renameSync('/nhs/seeded.txt', '/nhs/renamed.txt')
    vfs.rmSync('/nhs/created', { recursive: true })
    expect(mutations.map(mutation => ({
      kind: mutation.kind,
      path: mutation.path,
      ...mutation.kind === 'write' ? { entryChanged: mutation.entryChanged } : {},
      ...mutation.kind === 'chmod' ? { mode: mutation.mode } : {},
    }))).toEqual([
      { kind: 'write', path: '/nhs/seeded.txt', entryChanged: false },
      { kind: 'mkdir', path: '/nhs/created' },
      { kind: 'chmod', path: '/nhs/created', mode: 0o700 },
      { kind: 'remove', path: '/nhs/seeded.txt' },
      { kind: 'write', path: '/nhs/renamed.txt', entryChanged: true },
      { kind: 'remove', path: '/nhs/created' },
    ])
    const renamed = mutations[4]
    expect(renamed?.kind === 'write' && new TextDecoder().decode(renamed.bytes)).toBe('changed')
    expect(() => { vfs.writeFileSync('/missing/file', 'no') }).toThrow(/ENOENT/)
    expect(mutations).toHaveLength(6)
  })

  it('contains a faulty observer and lets disposal stop later notifications', () => {
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/nhs')
    const reported = vi.spyOn(console, 'error').mockImplementation(() => {})
    const first = vfs.subscribe(() => { throw new Error('observer failed') })
    const seen: string[] = []
    const second = vfs.subscribe((mutation) => { seen.push(mutation.path) })
    vfs.writeFileSync('/nhs/one', '1')
    first()
    second()
    vfs.writeFileSync('/nhs/two', '2')
    expect(seen).toEqual(['/nhs/one'])
    expect(reported).toHaveBeenCalledOnce()
  })

  it('feeds the same complete mutations to a durable sink and live subscribers', async () => {
    const recorded: VfsMutation[] = []
    let flushes = 0
    const sink: VfsMutationSink = {
      record: (mutation) => { recorded.push(mutation) },
      flush: async () => { flushes += 1 },
    }
    const vfs = new MemoryVfs({ sink })
    vfs.seedDirectory('/nhs')
    const observed: VfsMutation[] = []
    vfs.subscribe((mutation) => { observed.push(mutation) })
    vfs.writeFileSync('/nhs/log', 'a')
    vfs.appendFileSync('/nhs/log', 'bc')
    await vfs.flush()
    expect(observed).toEqual(recorded)
    expect(observed[0]).toBe(recorded[0])
    expect(recorded[0]).toMatchObject({ kind: 'write', path: '/nhs/log', mode: 0o644, entryChanged: true })
    expect(recorded[1]).toMatchObject({ kind: 'write', path: '/nhs/log', mode: 0o644, entryChanged: false, appendedFrom: 1 })
    expect(recorded[1]?.kind === 'write' && new TextDecoder().decode(recorded[1].bytes)).toBe('abc')
    expect(flushes).toBe(1)
  })

  it('publishes descriptor writes at the file identity current path', () => {
    const mutations: VfsMutation[] = []
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/source', 'old')
    const descriptor = vfs.openFileSync('/nhs/source', 'r+')
    vfs.subscribe((mutation) => { mutations.push(mutation) })
    vfs.renameSync('/nhs/source', '/nhs/destination')
    mutations.length = 0
    descriptor.write(0, new TextEncoder().encode('new'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/nhs/destination'])
    expect(vfs.readFileSync('/nhs/destination', 'utf8')).toBe('new')
    vfs.unlinkSync('/nhs/destination')
    mutations.length = 0
    descriptor.write(0, new TextEncoder().encode('detached'))
    expect(mutations).toEqual([])
    expect(new TextDecoder().decode(descriptor.read(0, descriptor.stat().size))).toBe('detached')
  })

  it('reports the path identity through a BigInt file handle stat', async () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/session.lock', '')
    const handle = vfs.open('/nhs/session.lock', 'w')
    const held = await handle.stat({ bigint: true }) as VfsBigIntStats
    const current = vfs.statSync('/nhs/session.lock', { bigint: true }) as VfsBigIntStats

    expect([held.dev, held.ino]).toEqual([current.dev, current.ino])
    await handle.chmod(0o600)
    expect((vfs.statSync('/nhs/session.lock') as VfsStats).mode & 0o777).toBe(0o600)
    await handle.close()
  })

  it('decomposes a directory rename into replayable destination state', () => {
    const recorded: VfsMutation[] = []
    const vfs = new MemoryVfs({
      sink: { record: (mutation) => { recorded.push(mutation) }, flush: () => Promise.resolve() },
    })
    vfs.seedDirectory('/nhs/staging/nested', { mode: 0o700 })
    vfs.seed('/nhs/staging/nested/file', 'value', { mode: 0o600 })
    vfs.renameSync('/nhs/staging', '/nhs/published')

    expect(recorded.map(mutation => [mutation.kind, mutation.path])).toEqual([
      ['remove', '/nhs/staging'],
      ['mkdir', '/nhs/published'],
      ['mkdir', '/nhs/published/nested'],
      ['write', '/nhs/published/nested/file'],
    ])
    expect(recorded[3]).toMatchObject({ kind: 'write', mode: 0o600, entryChanged: true })
    expect(recorded[3]?.kind === 'write' && new TextDecoder().decode(recorded[3].bytes)).toBe('value')
  })
})

describe('directory rename', () => {
  it('rejects file, non-empty directory, and missing-parent destinations before mutation', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/source/nested/file', 'source')
    vfs.seed('/nhs/file', 'destination')
    vfs.seed('/nhs/non-empty/child', 'destination')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    expect(() => { vfs.renameSync('/nhs/source', '/nhs/file') })
      .toThrow(expect.objectContaining({ code: 'ENOTDIR' }))
    expect(() => { vfs.renameSync('/nhs/source', '/nhs/non-empty') })
      .toThrow(expect.objectContaining({ code: 'ENOTEMPTY' }))
    expect(() => { vfs.renameSync('/nhs/source', '/missing/destination') })
      .toThrow(expect.objectContaining({ code: 'ENOENT' }))

    expect(vfs.readFileSync('/nhs/source/nested/file', 'utf8')).toBe('source')
    expect(vfs.readFileSync('/nhs/file', 'utf8')).toBe('destination')
    expect(vfs.readFileSync('/nhs/non-empty/child', 'utf8')).toBe('destination')
    expect(mutations).toEqual([])
  })

  it('replaces an empty directory with the source subtree', () => {
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/nhs/source/nested', { mode: 0o700 })
    vfs.seed('/nhs/source/nested/file', 'source')
    vfs.seedDirectory('/nhs/destination', { mode: 0o711 })

    vfs.renameSync('/nhs/source', '/nhs/destination')

    expect(vfs.existsSync('/nhs/source')).toBe(false)
    expect(vfs.readFileSync('/nhs/destination/nested/file', 'utf8')).toBe('source')
    expect((vfs.statSync('/nhs/destination') as VfsStats).mode & 0o777).toBe(0o755)
    expect((vfs.statSync('/nhs/destination/nested') as VfsStats).mode & 0o777).toBe(0o700)
  })
})

describe('hard links', () => {
  it('shares identity, bytes, and mode until one name is removed', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/session.jsonl', 'committed\n')
    vfs.linkSync('/nhs/session.jsonl', '/nhs/session-latest.jsonl')
    vfs.linkSync('/nhs/session-latest.jsonl', '/nhs/session-archive.jsonl')
    expect(identity(vfs, '/nhs/session-latest.jsonl')).toBe(identity(vfs, '/nhs/session.jsonl'))
    expect(linkCount(vfs, '/nhs/session.jsonl')).toBe(3n)
    expect(vfs.readFileSync('/nhs/session-latest.jsonl', 'utf8')).toBe('committed\n')
    const changedPaths: string[] = []
    vfs.subscribe((mutation) => { changedPaths.push(mutation.path) })
    vfs.appendFileSync('/nhs/session.jsonl', 'appended\n')
    expect(changedPaths).toEqual([
      '/nhs/session.jsonl',
      '/nhs/session-latest.jsonl',
      '/nhs/session-archive.jsonl',
    ])
    expect(vfs.readFileSync('/nhs/session.jsonl', 'utf8')).toBe('committed\nappended\n')
    expect(vfs.readFileSync('/nhs/session-latest.jsonl', 'utf8')).toBe('committed\nappended\n')
    vfs.chmodSync('/nhs/session-latest.jsonl', 0o600)
    expect((vfs.statSync('/nhs/session.jsonl') as VfsStats).mode & 0o777).toBe(0o600)
    vfs.unlinkSync('/nhs/session-latest.jsonl')
    expect(linkCount(vfs, '/nhs/session.jsonl')).toBe(2n)
    vfs.unlinkSync('/nhs/session-archive.jsonl')
    expect(linkCount(vfs, '/nhs/session.jsonl')).toBe(1n)
    expect(vfs.readFileSync('/nhs/session.jsonl', 'utf8')).toBe('committed\nappended\n')
  })

  it('treats rename between names of the same node as a no-op', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/source', 'value')
    vfs.linkSync('/nhs/source', '/nhs/alias')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    vfs.renameSync('/nhs/source', '/nhs/alias')

    expect(vfs.readFileSync('/nhs/source', 'utf8')).toBe('value')
    expect(vfs.readFileSync('/nhs/alias', 'utf8')).toBe('value')
    expect(linkCount(vfs, '/nhs/source')).toBe(2n)
    expect(mutations).toEqual([])
  })

  it('retargets linked names through file replacement and directory moves', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/replacement', 'replacement')
    vfs.seed('/nhs/target', 'old')
    vfs.linkSync('/nhs/target', '/nhs/target-alias')
    const replaced = vfs.openFileSync('/nhs/target', 'r+')
    vfs.renameSync('/nhs/replacement', '/nhs/target')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    replaced.write(0, new TextEncoder().encode('changed'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/nhs/target-alias'])
    expect(vfs.readFileSync('/nhs/target', 'utf8')).toBe('replacement')
    expect(vfs.readFileSync('/nhs/target-alias', 'utf8')).toBe('changed')
    expect(linkCount(vfs, '/nhs/target-alias')).toBe(1n)

    vfs.seed('/nhs/tree/file', 'tree')
    vfs.linkSync('/nhs/tree/file', '/nhs/outside')
    const moved = vfs.openFileSync('/nhs/tree/file', 'r+')
    vfs.renameSync('/nhs/tree', '/nhs/moved')
    mutations.length = 0
    moved.write(0, new TextEncoder().encode('moved'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/nhs/outside', '/nhs/moved/file'])
    expect(linkCount(vfs, '/nhs/moved/file')).toBe(2n)

    vfs.rmSync('/nhs/moved', { recursive: true })
    mutations.length = 0
    moved.write(0, new TextEncoder().encode('kept!'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/nhs/outside'])
    expect(vfs.readFileSync('/nhs/outside', 'utf8')).toBe('kept!')
    expect(linkCount(vfs, '/nhs/outside')).toBe(1n)
  })

  it('rejects renaming a file over an existing directory', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/nhs/file', 'value')
    vfs.seedDirectory('/nhs/directory')
    expect(() => { vfs.renameSync('/nhs/file', '/nhs/directory') }).toThrow(expect.objectContaining({ code: 'EISDIR' }))
    expect(vfs.readFileSync('/nhs/file', 'utf8')).toBe('value')
    expect(vfs.statSync('/nhs/directory').isDirectory()).toBe(true)
  })
})
