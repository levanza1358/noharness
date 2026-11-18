/**
 * Opt-in LAN access to the owned Host through a forwarding proxy.
 * The Host keeps its loopback bind and its private cookie; this proxy injects
 * that cookie, so a browser on another machine reaches the same Host process.
 *
 * The proxy forwards identity-encoded bodies unchanged, so it is transparent:
 * it neither re-encodes a response nor rewrites the headers that describe one.
 *
 * It authenticates no caller. Enabling exposure is the whole decision: any peer
 * that can reach the bound port drives the Host with its owner's full access,
 * so enable it only on a network whose peers are trusted.
 */
import type { IncomingHttpHeaders, IncomingMessage, OutgoingHttpHeaders, Server, ServerResponse } from 'node:http'
import { createServer, request as createRequest } from 'node:http'
import type { Duplex } from 'node:stream'
import net from 'node:net'
import { networkInterfaces } from 'node:os'

/** Headers the proxy owns: trust and transport facts belong to it, not the client. */
const STRIPPED_REQUEST_HEADERS = [
  'host', 'origin', 'cookie', 'connection', 'upgrade', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest',
  'transfer-encoding', 'content-length', 'accept-encoding',
]

/** Response headers withheld from a remote browser: the Host's private session cookie. */
const WITHHELD_RESPONSE_HEADERS = ['set-cookie']

/** Enabled exposure and the address remote browsers open. */
export interface DesktopNetworkExposureState {
  /** Address on the first non-internal IPv4 address. */
  readonly url: string
  /** Address on every non-internal IPv4 address, in interface order. */
  readonly urls: readonly string[]
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

/** @returns the Host socket address a proxy request dials. */
function dial(target: DesktopNetworkExposureTarget): { host: string; port: number } {
  const url = new URL(target.url)
  return { host: url.hostname.replace(/^\[|\]$/gu, ''), port: url.port === '' ? 80 : Number(url.port) }
}

/** Server of one enabled exposure. */
export class DesktopNetworkExposure {
  private server: Server | undefined
  private readonly sockets = new Set<Duplex>()

  /** @param options - Host reader and bind choices. */
  constructor(private readonly options: DesktopNetworkExposureOptions) {}

  /**
   * Bind on every interface and answer with the address to open.
   * @returns the enabled state; rejects when no LAN address or port is available.
   */
  async start(): Promise<DesktopNetworkExposureState> {
    if (this.server !== undefined) throw new Error('desktop network exposure: already listening')
    const addresses = (this.options.addresses ?? lanAddresses)()
    const address = addresses[0]
    if (address === undefined) throw new Error('desktop network exposure: this machine has no local network address')
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
    const urls = addresses.map(candidate => `http://${candidate}:${String(port)}/`)
    return { url: urls[0] as string, urls }
  }

  /** Stop listening and drop every proxied socket. */
  async stop(): Promise<void> {
    const server = this.server
    this.server = undefined
    for (const socket of this.sockets) socket.destroy()
    this.sockets.clear()
    if (server === undefined) return
    await new Promise<void>((resolve) => { server.close(() => { resolve() }) })
  }

  private handle(request: IncomingMessage, response: ServerResponse): void {
    const url = new URL(request.url ?? '/', 'http://proxy.invalid')
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
    // The body is piped verbatim, so the Host must answer unencoded: a
    // forwarded `content-encoding` the proxy never decodes would reach the
    // remote browser as bytes it cannot interpret.
    headers['accept-encoding'] = 'identity'
    return headers
  }

  /** Pipe one WebSocket upgrade to the Host with the same injected credential. */
  private upgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const url = new URL(request.url ?? '/', 'http://proxy.invalid')
    const target = this.options.upstream()
    if (target === undefined) {
      socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\nContent-Length: 0\r\n\r\n')
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
