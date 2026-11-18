---
kind: upgrade-guide
description: "LAN access opens the plain address shown in Settings; the per-run token link is gone."
---

# Open the advertised LAN address directly

## Change

**Share on the local network** no longer issues a per-run token. The address Settings shows is the plain `http://<lan-address>:<port>/` on every non-internal IPv4 interface, and a browser opens it with no credential: the previous `?token=…` exchange, its 303 redirect, and its `nhs-exposed-network` cookie are gone, and a request or WebSocket upgrade carrying no credential is forwarded instead of answered with 401.

The proxy still binds `0.0.0.0` and injects the Host's loopback session cookie, so enabling exposure is the whole authorization decision: any peer that can reach the port drives the Host with the owner's full access, including its filesystem, shell, and model credentials. Enable it only on a network whose peers are trusted.

Remote pages also render as pages again. The proxy used to withhold `content-encoding` while forwarding the Host's body unchanged, so a compressed response reached the browser as bytes it could not decode; it now asks the Host for an identity-encoded response.

## Migration

1. Update every bookmark, shortcut, or pasted link that carried a token to the address Settings shows now. An old `?token=…` link still opens the page, because the query parameter is ignored, but the value no longer authorizes anything and can be dropped.
2. Decide whether this deployment may stay exposed. A host reachable beyond a private network — a corporate LAN, a shared Wi-Fi, a public address — now has no credential in front of the agent; turn **Share on the local network** off, or restrict the port at the network layer.
3. Open the address from another device and confirm the application loads: the page renders, and the conversation and Settings work. A page that loads but renders binary characters means an older proxy build is still installed.
