# Design it twice

Parallel sub-agent pattern for exploring alternative interfaces for a chosen deepening candidate. Based on Ousterhout's advice that a first idea is unlikely to be the best one.

Uses the vocabulary in [SKILL.md](SKILL.md): module, interface, seam, adapter, leverage.

## 1. Frame the problem space

Before spawning anything, write a user-facing explanation covering:

- the constraints any new interface must satisfy (the repo's Config, effect, and pre-stable API rules among them),
- the dependencies it relies on and their category from [DEEPENING.md](DEEPENING.md),
- a rough code sketch that grounds the constraints, not a proposal.

Show it, then continue immediately.

## 2. Spawn three or more sub-agents

Each gets a fresh context and the same technical brief (file paths, coupling, dependency category, what sits behind the seam), plus one different design constraint:

- Agent 1: "Minimise the interface: one to three entry points, maximum leverage per entry point."
- Agent 2: "Maximise flexibility: support many use cases and extensions."
- Agent 3: "Optimise for the most common caller: make the default case trivial."
- Agent 4, when a boundary is involved: "Design around ports and adapters."

Include both this skill's vocabulary and the project glossary vocabulary so each agent names things consistently.

Each agent outputs:

1. The interface: types, methods, parameters, plus invariants, ordering, and error modes.
2. A usage example showing how callers use it.
3. What the implementation hides behind the seam.
4. Dependency strategy and adapters.
5. Trade-offs: where leverage is high, where it is thin.

## 3. Present and compare

Present the designs in sequence so each can be absorbed, then compare them in prose by **depth**, **locality**, and **seam placement**. Finish with your own recommendation and a hybrid where parts combine well. Be opinionated: a strong read, not a menu.
