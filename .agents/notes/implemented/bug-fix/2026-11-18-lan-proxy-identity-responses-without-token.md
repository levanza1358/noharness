# Agent Note: Serve LAN access without a token, and forward the Host's response headers

Status: implemented

## Problem

Two defects in the Desktop LAN proxy (`apps/desktop/src/network-exposure.ts`).

**A remote browser rendered binary.** The proxy listed `content-encoding` among the response headers it withholds, while piping the Host's body through untouched. The Host gzips text responses (`webserver` `compression: 'gzip'`), so a remote browser received gzip bytes with no header saying so and displayed them as text. The page never loaded on another machine.

**The per-run token made the address unusable as an address.** Enabling **Share on the local network** produced a URL carrying `?token=…` that exchanged for a cookie; any plain `http://<lan-address>:<port>/` answered 401. The token was a second credential to carry around, and every reload from a bookmark, a link pasted into another application, or a second browser needed it again.

## Decision

**The proxy requests an identity-encoded response and forwards the headers that describe the body.** It now sends `accept-encoding: identity` upstream instead of passing the client's value through, so the Host's negotiation answers unencoded — the behavior `webserver.spec.ts` already pins for an identity-preferring client. `content-encoding` and `content-length` leave the withheld list, which now holds only `set-cookie`: the Host's private session cookie is the one header the proxy genuinely owns, because it injects its own.

**LAN exposure authenticates no caller.** The proxy keeps injecting the Host's loopback cookie and keeps binding `0.0.0.0`, but it no longer mints a token, no longer redirects a token exchange, and no longer refuses a request or an upgrade for a missing credential. The advertised address is the plain `http://<lan-address>:<port>/`, one per non-internal IPv4 interface. Enabling exposure is the whole authorization decision.

## Alternatives considered

**Forward `content-encoding` and leave `accept-encoding` alone.** Rejected as the smaller fix: a compressed body over a LAN buys little, and letting the client's encoding reach the Host leaves the proxy depending on two headers agreeing instead of making the Host answer in the one form the proxy can forward unconditionally.

**Keep the token and let a settings field disable it.** Rejected: the user enabling LAN exposure has already made the trust decision the token was standing in for, and a second switch over the same decision asks the same question twice. The README now states the consequence where the switch is documented, and the module doc states it where the proxy is implemented.

**Keep the token for upgrades only.** Rejected: a browser that loads the page sets no upgrade credential from its own credential store, so this would restore the same 401 on the first WebSocket.

## Consequences

Opening the address shown in Settings on another device loads the application directly, on every listed interface, with no link to copy apart from a plain URL. Anyone who can reach the bound port drives the Host with the owner's full access — file, shell, and model credentials included — so exposure belongs on a trusted network only. A browser that still holds an old `?token=…` address reaches the page, because the query is now ignored rather than required.

The proxy is transparent in the response direction: what the Host says about a body's encoding and length reaches the client unchanged, so the binary-page failure cannot recur through a compression choice. `.spec.ts` cases cover the identity request, the forwarded transfer headers, the plain advertised address, credential-free admission of both requests and upgrades, and the 503 answer before the Host exists.
