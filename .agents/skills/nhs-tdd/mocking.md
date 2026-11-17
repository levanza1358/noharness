# When to mock

Mock at system boundaries only: model providers, network peers, time and randomness, the real filesystem when a temp dir will not do, and child processes the test does not own.

Never mock your own modules, internal collaborators, or anything the test controls. In NoHarness, prefer a real Cordis `Context` with the real plugin under test over a fake service.

## Designing for mockability

**Inject dependencies.** Take the collaborator as a parameter rather than constructing it inside.

```typescript
// easy to fake
export function summarize(request: SummarizeRequest, model: LanguageModelSpec): Summary

// hard to fake
export function summarize(request: SummarizeRequest): Summary {
  const model = new ProviderClient(process.env.DEEPSEEK_API_KEY)
}
```

**Prefer specific functions over one generic fetcher.** Each fake then returns one shape with no conditional logic in test setup.

**Config is the fake.** A deployment-varying choice belongs in a validated `Config` field, which the test sets directly instead of patching internals.
