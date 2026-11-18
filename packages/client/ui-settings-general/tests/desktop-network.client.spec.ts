import { expect, it, vi } from 'vitest'
import type { DesktopNetworkExposureView } from '../src/types.ts'
import { DesktopNetworkSource } from '../src/client/desktop-network-source.ts'

const off: DesktopNetworkExposureView = { enabled: false, failed: false, pending: false, port: 0 }
const on: DesktopNetworkExposureView = {
  enabled: true, url: 'http://192.168.1.20:4100/?token=abc', failed: false, pending: false, port: 4100,
}

function fixture() {
  const get = Promise.withResolvers<DesktopNetworkExposureView>()
  const set = Promise.withResolvers<DesktopNetworkExposureView>()
  let listener: (state: DesktopNetworkExposureView) => void = () => {}
  const unsubscribe = vi.fn()
  const write = vi.fn(() => set.promise)
  const source = new DesktopNetworkSource({ get: () => get.promise, set: write,
    subscribe(next) { listener = next; return unsubscribe } })
  return { source, get, set, write, unsubscribe, emit: (state: DesktopNetworkExposureView) => { listener(state) } }
}

it('adopts the shell state once it answers', async () => {
  const f = fixture()
  expect(f.source.store.getSnapshot()).toEqual(off)
  f.get.resolve(on)
  await f.get.promise
  expect(f.source.store.getSnapshot()).toEqual(on)
  f.source.dispose()
})

it('reports a failed initial read without inventing an address', async () => {
  const get = Promise.withResolvers<DesktopNetworkExposureView>()
  const source = new DesktopNetworkSource({ get: () => get.promise, set: async () => off, subscribe: () => () => {} })
  get.reject(new Error('unavailable'))
  await get.promise.catch(() => undefined)
  expect(source.store.getSnapshot()).toEqual({ ...off, failed: true })
  source.dispose()
})

it('keeps the shell snapshot after a change made elsewhere', async () => {
  const f = fixture()
  f.get.resolve(off)
  await f.get.promise
  f.emit(on)
  expect(f.source.store.getSnapshot()).toEqual(on)
  f.source.dispose()
  expect(f.unsubscribe).toHaveBeenCalledOnce()
})

it('applies the state the shell returns for an accepted write', async () => {
  const f = fixture()
  f.get.resolve(off)
  await f.get.promise
  const pending = f.source.set({ enabled: true })
  expect(f.write).toHaveBeenCalledWith({ enabled: true })
  expect(f.source.store.getSnapshot()).toMatchObject({ enabled: false, pending: true, failed: false })
  f.set.resolve(on)
  await pending
  expect(f.source.store.getSnapshot()).toEqual(on)
  f.source.dispose()
})

it('keeps the previous choice and reports a rejected write', async () => {
  const f = fixture()
  f.get.resolve(off)
  await f.get.promise
  const pending = f.source.set({ enabled: true })
  f.set.reject(new Error('proxy refused'))
  await pending
  expect(f.source.store.getSnapshot()).toEqual({ ...off, failed: true })
  f.source.dispose()
})

it('leaves a newer snapshot alone when the write answers late', async () => {
  const f = fixture()
  f.get.resolve(off)
  await f.get.promise
  const pending = f.source.set({ enabled: true })
  f.emit(on)
  f.set.resolve(on)
  await pending
  expect(f.source.store.getSnapshot()).toEqual(on)
  f.source.dispose()
})

it('ignores writes and answers after disposal', async () => {
  const f = fixture()
  f.get.resolve(off)
  await f.get.promise
  const pending = f.source.set({ enabled: true })
  f.source.dispose()
  f.set.resolve(on)
  await pending
  expect(f.source.store.getSnapshot().url).toBeUndefined()
  await f.source.set({ enabled: false })
  expect(f.write).toHaveBeenCalledOnce()
})
