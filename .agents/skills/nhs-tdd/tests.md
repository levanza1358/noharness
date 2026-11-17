# Good and bad tests

## Good tests

Test through the real interface of the seam.

```typescript
// GOOD: observable behaviour
const session = await ctx.sessions.create({ profile: 'headless' })
await session.prompt('summarize this file')
expect(session.events.filter(isAssistantText).at(-1)?.text).toEqual(expected)
```

Characteristics: uses the public interface only, survives internal refactors, describes what not how, one logical assertion per test.

## Bad tests

**Implementation-coupled.**

```typescript
// BAD: asserts a call, not an outcome
expect(selectPanel).toHaveBeenCalledWith('settings')
```

Red flags: mocking internal collaborators, testing private methods, asserting call counts or order, tests that break on refactor without a behaviour change, names describing how.

**Verified through a side channel.**

```typescript
// BAD: reads storage instead of the interface
await createUser({ name: 'Alice' })
expect(await db.query('SELECT * FROM users')).toHaveLength(1)

// GOOD: retrievable through the interface
const user = await createUser({ name: 'Alice' })
expect((await getUser(user.id)).name).toEqual('Alice')
```

**Tautological.**

```typescript
// BAD: expected value recomputed like the implementation
expect(calculateTotal(items)).toBe(items.reduce((sum, i) => sum + i.price, 0))

// GOOD: independent literal
expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15)
```
