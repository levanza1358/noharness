/** Built package smoke: headless consumers must not import the browser implementation. */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

const guard = registerHooks({
  resolve(specifier, context, next) {
    assert(!/^(?:react(?:-dom)?(?:\/|$)|@noharness\/nhs-client-)/.test(specifier), `Headless import reached ${specifier}`)
    const result = next(specifier, context)
    assert(!/\/cua\/lib\/(?:client(?:\/|\.)|types\/client\/)/.test(result.url), `Headless import reached ${result.url}`)
    return result
  },
})
const { Context } = await import('@noharness/cordis')
const host = await import('@noharness/cua')
const { createCuaApi } = await import('@noharness/cua/api')
const { CuaConfigFields } = await import('@noharness/cua/config')
assert.equal(typeof CuaConfigFields.connectTimeoutMs.default, 'function')
const { connectCua } = await import('@noharness/cua/bridge')
const { NativeClient } = await import('@noharness/cua/native-client')
const { Request } = await import('@noharness/cua/protocol')
for (const callable of [host.apply, host.installCua, host.CuaAccess, createCuaApi, connectCua, NativeClient]) assert.equal(typeof callable, 'function')
assert.equal(Request.parse({ method: 'getCapabilities', params: {} }).method, 'getCapabilities')
const ctx = new Context()
try { await ctx.plugin(host); assert.equal(ctx.get('cuaAccess'), undefined) }
finally { await ctx.fiber.dispose() }
guard.deregister()
const remote = await import('@noharness/cua/remote')
assert.equal(remote.default.package, '@noharness/cua')
assert.equal(remote.default.descriptors.length, 9)
process.stdout.write('headless exports and generated Remote passed\n')
