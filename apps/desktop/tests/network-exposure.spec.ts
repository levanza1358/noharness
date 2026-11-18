import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { connect } from 'node:net'
import { gzipSync } from 'node:zlib'
import { afterEach, expect, it } from 'vitest'
import { DesktopNetworkExposure, type DesktopNetworkExposureTarget } from '../src/network-exposure.ts'

const running: DesktopNetworkExposure[] = []
const servers: Server[] = []

afterEach(async () => {
  await Promise.all(running.splice(0).map(async (exposure) => { await exposure.stop() }))
  await Promise.all(servers.splice(0).map(async server => new Promise<void>((resolve) => { server.close(() => { resolve() }) })))
})

/** Host stand-in: records what the proxy sent and answers with its own cookie. */
async function upstream() {
  const seen: {
    url: string
    cookie: string | undefined
    host: string | undefined
    acceptEncoding: string | undefined
    body: string
  }[] = []
  const server = createServer((request, response) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => { body += chunk })
    request.on('end', () => {
      seen.push({
        url: request.url ?? '',
        cookie: request.headers.cookie,
        host: request.headers.host,
        acceptEncoding: request.headers['accept-encoding'],
        body,
      })
      response.writeHead(200, { 'content-type': 'text/plain', 'set-cookie': ['host-private=1'] })
      response.end(`host:${request.url ?? ''}`)
    })
  })
  servers.push(server)
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', () => { resolve() }) })
  const target: DesktopNetworkExposureTarget = {
    url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}/`, cookie: 'nhs-desktop-session=private',
  }
  return { seen, target }
}

/** Start one exposure; `loopback` dials the proxy locally while it advertises a LAN address. */
async function exposure(targets: () => DesktopNetworkExposureTarget | undefined) {
  const exposure = new DesktopNetworkExposure({ upstream: targets, addresses: () => ['192.168.1.20'] })
  running.push(exposure)
  const state = await exposure.start()
  const advertised = new URL(state.url)
  return { exposure, state, origin: `http://127.0.0.1:${advertised.port}`,
    advertised: `${advertised.hostname}:${advertised.port}` }
}

it('advertises one plain LAN address per interface', async () => {
  const target = await upstream()
  const instance = new DesktopNetworkExposure({
    upstream: () => target.target,
    addresses: () => ['192.168.1.20', '10.0.0.5'],
  })
  running.push(instance)
  const state = await instance.start()
  expect(state.urls.map(url => new URL(url).hostname)).toEqual(['192.168.1.20', '10.0.0.5'])
  expect(new URL(state.url).searchParams.toString()).toBe('')
  expect(new URL(state.urls[1] as string).searchParams.toString()).toBe('')
})

it('admits a request with no credential and forwards it to the Host', async () => {
  const target = await upstream()
  const { origin, advertised } = await exposure(() => target.target)
  expect(advertised).toBe(`192.168.1.20:${new URL(origin).port}`)
  const answer = await fetch(`${origin}/index.html`)
  expect(answer.status).toBe(200)
  expect(await answer.text()).toBe('host:/index.html')
  expect(target.seen[0]?.cookie).toBe(target.target.cookie)
})

it('forwards with the Host cookie, its own authority, and no Host set-cookie', async () => {
  const target = await upstream()
  const { origin } = await exposure(() => target.target)
  const answer = await fetch(`${origin}/api/boot?x=1`, { headers: { cookie: 'browser=own' } })
  expect(await answer.text()).toBe('host:/api/boot?x=1')
  expect(answer.headers.get('set-cookie')).toBeNull()
  expect(target.seen[0]).toMatchObject({
    url: '/api/boot?x=1', cookie: target.target.cookie, host: new URL(target.target.url).host, body: '',
  })
})

it('asks the Host for an unencoded response', async () => {
  const target = await upstream()
  const { origin } = await exposure(() => target.target)
  await fetch(`${origin}/`, { headers: { 'accept-encoding': 'gzip, deflate, br' } })
  expect(target.seen[0]?.acceptEncoding).toBe('identity')
})

it('delivers a readable body from a compressing Host', async () => {
  const page = '<!doctype html><html><body>NoHarness</body></html>'
  const server = createServer((request, response) => {
    // A Host that gzips any client accepting gzip, as `webserver` does.
    if (request.headers['accept-encoding']?.includes('gzip') === true) {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-encoding': 'gzip' })
      response.end(gzipSync(page))
      return
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    response.end(page)
  })
  servers.push(server)
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', () => { resolve() }) })
  const { origin } = await exposure(() => ({
    url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}/`, cookie: 'nhs-desktop-session=private',
  }))
  // A browser asks for gzip; the proxy must still hand it text it can render.
  const answer = await fetch(`${origin}/`, { headers: { 'accept-encoding': 'gzip, deflate, br' } })
  expect(await answer.text()).toBe(page)
})

it('forwards a request body', async () => {
  const target = await upstream()
  const { origin } = await exposure(() => target.target)
  const answer = await fetch(`${origin}/api/settings`, {
    method: 'POST', body: '{"method":"describe"}',
  })
  expect(await answer.text()).toBe('host:/api/settings')
  expect(target.seen[0]?.body).toBe('{"method":"describe"}')
})

it('reports an unanswerable Host and refuses to start without a LAN address', async () => {
  const { origin } = await exposure(() => ({ url: 'http://127.0.0.1:1/', cookie: 'x' }))
  const answer = await fetch(`${origin}/`)
  expect(answer.status).toBe(502)
  expect(await answer.text()).toContain('did not answer')
  await expect(new DesktopNetworkExposure({ upstream: () => undefined, addresses: () => [] }).start())
    .rejects.toThrow('no local network address')
})

it('answers 503 before the Host exists and stops listening on stop', async () => {
  const { exposure: instance, origin } = await exposure(() => undefined)
  expect((await fetch(`${origin}/`)).status).toBe(503)
  await instance.stop()
  await expect(instance.stop()).resolves.toBeUndefined()
  await expect(fetch(`${origin}/`)).rejects.toThrow()
})

it('refuses a second start', async () => {
  const target = await upstream()
  const { exposure: instance } = await exposure(() => target.target)
  await expect(instance.start()).rejects.toThrow('already listening')
})

it('forwards a WebSocket upgrade', async () => {
  const server = createServer()
  servers.push(server)
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', () => { resolve() }) })
  const port = (server.address() as AddressInfo).port
  server.on('upgrade', (_request, socket) => {
    socket.end('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n')
  })
  const { origin } = await exposure(() => ({ url: `http://127.0.0.1:${String(port)}/`, cookie: 'nhs-desktop-session=private' }))
  const upgrade = async (): Promise<string> => new Promise((resolve) => {
    const socket = connect(Number(new URL(origin).port), '127.0.0.1', () => {
      socket.write('GET /api HTTP/1.1\r\nHost: 192.168.1.20\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n')
    })
    socket.setEncoding('utf8')
    socket.on('data', (chunk: string) => { resolve(chunk); socket.destroy() })
    socket.on('error', () => { resolve('') })
  })
  expect(await upgrade()).toContain('101')
})
