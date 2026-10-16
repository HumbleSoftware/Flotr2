# Software Factory Vision

The idea behind the factories we build, across every project. [FACTORY.md](FACTORY.md) is the model that implements it.

## Purpose

Push the edge of what automated software factories can do: hand coding agents as much of the work as they can safely carry, and keep raising that ceiling.

Each project is a worked example. Flotr2 is the first.

## Thesis

**Autonomy without disaster.** Full autonomy, handed over all at once, ends badly. Autonomy earned in steps, measured, and revocable compounds.

Most of the tooling being built makes agents *more parallel*. Very little makes them *accountable*: who authored a change, under which policy, past which gate, at what rework cost. Accountability is what lets throughput rise safely, so that's where the effort goes.

## The Ratchet

Throughput, parallelism and autonomy all ratchet up, and the ratchet turns both ways.

- **Autonomy is earned per risk tier.** A tier gains autonomy (auto-planning, then auto-merge) when telemetry shows its work landing cleanly.
- **Autonomy is revoked automatically.** When rework, reverts or escaped defects rise in a tier, it drops back a level until the cause is fixed.
- **Parallelism grows with what can absorb it:** conflict-aware dispatch, and review capacity (agent and human).
- **Verification sets the pace.** Autonomy rises only as fast as the checks that catch bad work improve.

The human seats are handed off in order:

1. **Router:** delivering events and unsticking sessions. Mostly mechanical; automated first.
2. **Mayor:** deciding what to build. Shrinks to approving intent.
3. **Judge:** deciding whether it lands. Becomes risk-tiered. Low-risk work merges on guarded auto-merge; high-risk work keeps a human.

## Invariants

These hold at every level of the ratchet:

- **Every change is traceable** to a ticket, a policy version, an executor and the gate it passed.
- **Gates are proportional to risk**, and every gate is explicit, logged and enforced by code, not convention.
- **The author never approves its own work.**
- **State lives in git and GitHub**, so any factory can be killed and restarted without loss.
- **Safety never depends on a preview feature.** Adopted primitives are replaceable; the trust boundary, sandbox and identity model are not optional.

## Portfolio

- **Every project gets a factory,** including the toolkit itself. The toolkit's factory runs on its last pinned release.
- **Shared policy improves across all factories.** Lessons from one project land in the shared layer and benefit the rest.
- **Telemetry compares factories**, not just tickets: what works on one project is evidence for the others.

## Scale Path

Solo and local today, on tmux. Cloud and team-shared later. The design keeps that path open: state in git and GitHub, an attach point that can be tmux, a GUI or a browser, and per-factory isolation from day one.

## Stance

- **Hybrid buy and build.** Adopt first-party primitives, borrow proven designs, build the control plane nobody else has (see the [buy-vs-build report](reports/Software%20factory%20build%20or%20buy.md)).
- **Claude-first,** with primitives kept swappable.
- **Real work is the measurement.** Telemetry from actual tickets, not synthetic benchmarks, until shared policy is worth protecting with evals.

## Non-Goals

- **Untraceable change:** work whose origin, policy or gate can't be reconstructed.
- **Unearned autonomy:** raising a tier's autonomy on vibes instead of telemetry.
- **Swarms:** self-directed agents coordinating among themselves with no plan and no accountability. Many agents are fine; unaccountable ones aren't.

## Open Threads

- **Naming:** the toolkit's name (hsd was a first stab).
- **Substrate:** whether HGT stays a separate substrate or folds into the toolkit.
- **Home:** this file and [FACTORY.md](FACTORY.md) move to the toolkit's repo once it exists.
