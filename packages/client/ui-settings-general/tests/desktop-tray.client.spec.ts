import { expect, it, vi } from 'vitest'
import { DesktopTraySource } from '../src/client/desktop-tray-source.ts'

function fixture() {
  const get = Promise.withResolvers<boolean>()
  const set = Promise.withResolvers<undefined>()
  let listener: (enabled: boolean) => void = () => {}
  const unsubscribe = vi.fn()
  const write = vi.fn(() => set.promise)
  const source = new DesktopTraySource({ get: () => get.promise, set: write,
    subscribe(next) { listener = next; return unsubscribe } })
  return { source, get, set, write, unsubscribe, emit: (enabled: boolean) => { listener(enabled) } }
}

it('applies the shell choice once the write settles', async () => {
  const f = fixture()
  f.get.resolve(true)
  await f.get.promise
  const pending = f.source.set(false)
  expect(f.source.store.getSnapshot()).toMatchObject({ enabled: true, pending: true })
  f.set.resolve(undefined)
  await pending
  expect(f.source.store.getSnapshot()).toEqual({ enabled: false, failed: false, pending: false })
  f.source.dispose()
  expect(f.unsubscribe).toHaveBeenCalledOnce()
})

it('keeps the previous choice and reports a rejected write', async () => {
  const f = fixture()
  f.get.resolve(true)
  await f.get.promise
  const pending = f.source.set(false)
  f.set.reject(new Error('IPC closed'))
  await pending
  expect(f.source.store.getSnapshot()).toEqual({ enabled: true, failed: true, pending: false })
  f.source.dispose()
})

it('lets a change from another window win over a stale reply', async () => {
  const f = fixture()
  f.get.resolve(true)
  await f.get.promise
  const pending = f.source.set(false)
  f.emit(true)
  f.set.resolve(undefined)
  await pending
  expect(f.source.store.getSnapshot()).toEqual({ enabled: true, failed: false, pending: false })
  f.source.dispose()
})

it('ignores a rejected initial read and everything after disposal', async () => {
  const f = fixture()
  f.get.reject(new Error('unavailable'))
  await Promise.resolve()
  expect(f.source.store.getSnapshot()).toEqual({ enabled: true, failed: true, pending: false })
  const pending = f.source.set(false)
  f.source.dispose()
  const before = f.source.store.getSnapshot()
  f.emit(false)
  f.get.resolve(false)
  f.set.resolve(undefined)
  await pending
  await f.source.set(true)
  expect(f.write).toHaveBeenCalledOnce()
  expect(f.source.store.getSnapshot()).toBe(before)
})
