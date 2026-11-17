/**
 * Opt-in LAN access to the owned Host through a token-gated reverse proxy.
 * The Host keeps its loopback bind and its private cookie; this proxy injects
 * that cookie, so the per-run token is the only remote credential.
 */
import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { IncomingHttpHeaders, IncomingMessage, OutgoingHttpHeaders, Server, ServerResponse } from 'node:http'
import { createServer, request as createRequest } from 'node:http'
import type { Duplex } from 'node:stream'
import net from 'node:net'
import { networkInterfaces } from 'node:os'

/** Query and cookie name carrying the proxy's per-run token. */
const TOKEN_PARAM = 'token'
const COOKIE_NAME = 'nhs-exposed-network'

/** Headers the proxy owns: trust and transport facts belong to it, not the client. */
const STRIPPED_REQUEST_HEADERS = [
  'host', 'origin', 'cookie', 'connection', 'upgrade', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest',
  'transfer-encoding', 'content-length',
]

/** Response headers withheld from a remote browser. */
const WITHHELD_RESPONSE_HEADERS = ['set-cookie', 'content-encoding', 'content-length']

/** Enabled exposure and the address remote browsers open. */
export interface DesktopNetworkExposureState {
  /** Tokenized URL on the first non-internal IPv4 address. */
  readonly url: string
}

/** One owned Host the proxy reaches. */
export interface DesktopNetworkExposureTarget {
  readonly url: string
  readonly cookie: string
}

/** Proxy lifetime and the Host it forwards to. */
export interface DesktopNetworkExposureOptions {
  /** Read the live Host origin and cookie; undefined before boot and after teardown. */
  readonly upstream: () => DesktopNetworkExposureTarget | undefined
  /** Bind port; default: an OS-assigned one. */
  readonly port?: number
  /** Read the network interfaces; tests replace the sampled addresses. */
  readonly addresses?: () => string[]
}

/**
 * @returns Non-internal IPv4 addresses, which LAN peers can dial.
 */
function lanAddresses(): string[] {
  return Object.values(networkInterfaces()).flatMap(entries => (entries ?? [])
    .filter(entry => entry.family === 'IPv4' && !entry.internal)
    .map(entry => entry.address))
}

/** @returns whether `value` names the expected token without leaking its prefix. */
function tokenMatches(value: string, token: string): boolean {
  const actual = Buffer.from(value)
  const expected = Buffer.from(token)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/** @returns the proxy token carried by the request's cookie header, if any. */
function cookieToken(headers: IncomingHttpHeaders): string | undefined {
  const raw = headers.cookie
  if (typeof raw !== 'string') return undefined
  let found: string | undefined
  for (const part of raw.split(';')) {
    const equals = part.indexOf('=')
    if (equals < 0 || part.slice(0, equals).trim() !== COOKIE_NAME) continue
    if (found !== undefined) return undefined
    found = part.slice(equals + 1).trim()
  }
  return found
}

/** @returns the Host socket address a proxy request dials. */
function dial(target: DesktopNetworkExposureTarget): { host: string; port: number } {
  const url = new URL(target.url)
  return { host: url.hostname.replace(/^\[|\]$/gu, ''), port: url.port === '' ? 80 : Number(url.port) }
}

/** Server and token of one enabled exposure. */
export class DesktopNetworkExposure {
  private server: Server | undefined
  private readonly sockets = new Set<Duplex>()
  private token = ''

  /** @param options - Host reader and bind choices. */
  constructor(private readonly options: DesktopNetworkExposureOptions) {}

  /**
   * Bind on every interface and answer with the tokenized address.
   * @returns the enabled state; rejects when no LAN address or port is available.
   */
  async start(): Promise<DesktopNetworkExposureState> {
    if (this.server !== undefined) throw new Error('desktop network exposure: already listening')
    const address = (this.options.addresses ?? lanAddresses)()[0]
    if (address === undefined) throw new Error('desktop network exposure: this machine has no local network address')
    this.token = randomBytes(32).toString('base64url')
    const server = createServer((request, response) => { this.handle(request, response) })
    server.on('upgrade', (request, socket, head) => { this.upgrade(request, socket, head) })
    this.server = server
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(this.options.port ?? 0, '0.0.0.0', () => {
          server.off('error', reject)
          resolve()
        })
      })
    } catch (error) {
      this.server = undefined
      throw error
    }
    const port = (server.address() as net.AddressInfo).port
    return { url: `http://${address}:${String(port)}/?${TOKEN_PARAM}=${this.token}` }
  }

  /** Stop listening and drop every proxied socket. */
  async stop(): Promise<void> {
    const server = this.server
    this.server = undefined
    this.token = ''
    for (const socket of this.sockets) socket.destroy()
    this.sockets.clear()
    if (server === undefined) return
    await new Promise<void>((resolve) => { server.close(() => { resolve() }) })
  }

  private handle(request: IncomingMessage, response: ServerResponse): void {
    const url = new URL(request.url ?? '/', 'http://proxy.invalid')
    if (this.token !== '' && url.searchParams.get(TOKEN_PARAM) === this.token) {
      response.writeHead(303, {
        'cache-control': 'no-store',
        'location': './',
        'referrer-policy': 'no-referrer',
        'set-cookie': `${COOKIE_NAME}=${this.token}; Path=/; HttpOnly; SameSite=Lax`,
      })
      response.end()
      return
    }
    const cookie = cookieToken(request.headers)
    if (this.token === '' || cookie === undefined || !tokenMatches(cookie, this.token)) {
      response.writeHead(401, { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' })
      response.end('NoHarness: reopen the address with its token.\n')
      return
    }
    const target = this.options.upstream()
    if (target === undefined) {
      response.writeHead(503, { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' })
      response.end('NoHarness: the local host is not running.\n')
      return
    }
    this.forward(request, response, target, url)
  }

  /** Pipe one accepted request to the Host and stream its answer back. */
  private forward(
    request: IncomingMessage,
    response: ServerResponse,
    target: DesktopNetworkExposureTarget,
    url: URL,
  ): void {
    const upstream = createRequest({
      ...dial(target),
      method: request.method,
      path: `${url.pathname}${url.search}`,
      headers: this.headers(request.headers, target),
    }, (answer) => {
      const outgoing: OutgoingHttpHeaders = {}
      for (const [name, value] of Object.entries(answer.headers)) {
        if (value === undefined || WITHHELD_RESPONSE_HEADERS.includes(name)) continue
        outgoing[name] = value
      }
      response.writeHead(answer.statusCode ?? 502, outgoing)
      answer.pipe(response)
    })
    upstream.once('error', () => {
      if (response.headersSent) { response.destroy(); return }
      response.writeHead(502, { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' })
      response.end('NoHarness: the local host did not answer.\n')
    })
    response.once('close', () => { upstream.destroy() })
    request.pipe(upstream)
  }

  /** Copy the client headers, dropping everything the proxy owns. */
  private headers(request: IncomingHttpHeaders, target: DesktopNetworkExposureTarget): OutgoingHttpHeaders {
    const headers: OutgoingHttpHeaders = {}
    for (const [name, value] of Object.entries(request)) {
      if (value === undefined || STRIPPED_REQUEST_HEADERS.includes(name)) continue
      headers[name] = value
    }
    headers['host'] = new URL(target.url).host
    headers['cookie'] = target.cookie
    return headers
  }

  /** Pipe one WebSocket upgrade to the Host with the same injected credential. */
  private upgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const url = new URL(request.url ?? '/', 'http://proxy.invalid')
    const cookie = cookieToken(request.headers)
    const target = this.options.upstream()
    if (target === undefined || this.token === '' || cookie === undefined || !tokenMatches(cookie, this.token)) {
      socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n')
      return
    }
    const upstream = net.connect(dial(target))
    this.sockets.add(upstream)
    this.sockets.add(socket)
    const close = (): void => {
      this.sockets.delete(upstream)
      this.sockets.delete(socket)
      socket.destroy()
      upstream.destroy()
    }
    upstream.once('error', close)
    upstream.once('close', close)
    socket.once('error', close)
    socket.once('close', close)
    upstream.once('connect', () => {
      const lines = [`${request.method ?? 'GET'} ${url.pathname}${url.search} HTTP/1.1`]
      for (const [name, value] of Object.entries(this.headers(request.headers, target))) {
        if (value === undefined) continue
        for (const entry of Array.isArray(value) ? value : [value]) lines.push(`${name}: ${String(entry)}`)
      }
      lines.push('connection: Upgrade', 'upgrade: websocket')
      upstream.write(`${lines.join('\r\n')}\r\n\r\n`)
      if (head.length > 0) upstream.write(head)
      socket.pipe(upstream)
      upstream.pipe(socket)
    })
  }
}
