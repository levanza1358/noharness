import { describe, expect, it } from 'vitest'
import { Context } from '@noharness/cordis'
import SessionStore, { type SessionId } from '@noharness/session'
import TypertRegistry from '@noharness/typert-registry'
import { brandString } from '@noharness/brand'

describe('Session Typert provider', () => {
  it('contributes live Session lookup in either service load order', async () => {
    const ctx = new Context()
    const sessionFiber = ctx.plugin(SessionStore)
    await sessionFiber
    await ctx.plugin(TypertRegistry)
    const session = ctx.sessions.create(brandString<SessionId>('remote-session'))

    const lookup = ctx.typert.lookups.get('session')
    expect(lookup).toMatchObject({
      parameter: 'session',
      wire: 'sessionId',
      resource: 'session',
      hostTypeSymbol: '@noharness/session#Session',
      wireTypeSymbol: '@noharness/session/types#SessionId',
    })
    expect(lookup?.resolve(session.id)).toBe(session)

    await sessionFiber.dispose()
    expect(ctx.typert.lookups.get('session')).toBeUndefined()
  })
})
