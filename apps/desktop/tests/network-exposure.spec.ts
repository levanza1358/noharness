import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { connect } from 'node:net'
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
  const seen: { url: string; cookie: string | undefined; host: string | undefined; body: string }[] = []
  const server = createServer((request, response) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => { body += chunk })
    request.on('end', () => {
      seen.push({ url: request.url ?? '', cookie: request.headers.cookie, host: request.headers.host, body })
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
    advertised: `${advertised.hostname}:${advertised.port}`, token: advertised.searchParams.get('token') ?? '' }
}

it('advertises one tokenized LAN address and bootstraps a private cookie from it', async () => {
  const target = await upstream()
  const { state, origin, token, advertised } = await exposure(() => target.target)
  expect(advertised).toBe(`192.168.1.20:${new URL(state.url).port}`)
  expect(token.length).toBeGreaterThan(20)
  const answer = await fetch(`${origin}/?token=${token}`, { redirect: 'manual' })
  expect(answer.status).toBe(303)
  expect(answer.headers.get('location')).toBe('./')
  expect(answer.headers.get('referrer-policy')).toBe('no-referrer')
  expect(answer.headers.get('set-cookie')).toContain('nhs-exposed-network=')
  expect(target.seen).toHaveLength(0)
})

it('rejects a missing or foreign cookie without reaching the Host', async () => {
  const target = await upstream()
  const { origin } = await exposure(() => target.target)
  expect((await fetch(`${origin}/index.html`)).status).toBe(401)
  expect((await fetch(`${origin}/index.html`, { headers: { cookie: 'nhs-exposed-network=wrong' } })).status).toBe(401)
  expect(target.seen).toHaveLength(0)
})

it('forwards with the Host cookie, its own authority, and no Host set-cookie', async () => {
  const target = await upstream()
  const { origin, token } = await exposure(() => target.target)
  const answer = await fetch(`${origin}/api/boot?x=1`, { headers: { cookie: `nhs-exposed-network=${token}` } })
  expect(await answer.text()).toBe('host:/api/boot?x=1')
  expect(answer.headers.get('set-cookie')).toBeNull()
  expect(target.seen[0]).toEqual({ url: '/api/boot?x=1', cookie: target.target.cookie, host: new URL(target.target.url).host, body: '' })
})

it('forwards a request body', async () => {
  const target = await upstream()
  const { origin, token } = await exposure(() => target.target)
  const answer = await fetch(`${origin}/api/settings`, {
    method: 'POST', body: '{"method":"describe"}', headers: { cookie: `nhs-exposed-network=${token}` },
  })
  expect(await answer.text()).toBe('host:/api/settings')
  expect(target.seen[0]?.body).toBe('{"method":"describe"}')
})

it('reports an unanswerable Host and refuses to start without a LAN address', async () => {
  const { origin, token } = await exposure(() => ({ url: 'http://127.0.0.1:1/', cookie: 'x' }))
  const answer = await fetch(`${origin}/`, { headers: { cookie: `nhs-exposed-network=${token}` } })
  expect(answer.status).toBe(502)
  expect(await answer.text()).toContain('did not answer')
  await expect(new DesktopNetworkExposure({ upstream: () => undefined, addresses: () => [] }).start())
    .rejects.toThrow('no local network address')
})

it('answers 503 before the Host exists and stops listening on stop', async () => {
  const { exposure: instance, origin, token } = await exposure(() => undefined)
  expect((await fetch(`${origin}/`, { headers: { cookie: `nhs-exposed-network=${token}` } })).status).toBe(503)
  await instance.stop()
  await expect(instance.stop()).resolves.toBeUndefined()
  await expect(fetch(`${origin}/`, { headers: { cookie: `nhs-exposed-network=${token}` } })).rejects.toThrow()
})

it('refuses a second start and mixes a fresh token when restarted', async () => {
  const target = await upstream()
  const { exposure: instance, token } = await exposure(() => target.target)
  await expect(instance.start()).rejects.toThrow('already listening')
  await instance.stop()
  const restarted = await instance.start()
  expect(new URL(restarted.url).searchParams.get('token')).not.toBe(token)
})

it('admits a WebSocket upgrade only with the proxy cookie', async () => {
  const target = await upstream()
  const { origin, token } = await exposure(() => target.target)
  const port = Number(new URL(origin).port)
  const upgrade = async (headers: string): Promise<string> => new Promise((resolve) => {
    const socket = connect(port, '127.0.0.1', () => {
      socket.write(`GET /api HTTP/1.1\r\nHost: 192.168.1.20\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n${headers}\r\n`)
    })
    socket.setEncoding('utf8')
    socket.on('data', (chunk: string) => { resolve(chunk); socket.destroy() })
    socket.on('error', () => { resolve('') })
  })
  expect(await upgrade('')).toContain('401')
  expect(await upgrade(`Cookie: nhs-exposed-network=${token}\r\n`)).toContain('200')
})
