# Software Factory Model

The general model for how a factory does work, applied per project. [VISION.md](VISION.md) is the why; this is the how.

References: [HGT](https://github.com/cesutherland/hgt), [The AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook), [buy-vs-build report](reports/Software%20factory%20build%20or%20buy.md).

## Layers

| Layer | What it is | Lives | Kubernetes analogy |
|---|---|---|---|
| **Policy** | Committed rules the factory follows: `CLAUDE.md`, skills, hooks, artifact templates, risk tiers | Per project, in the repo | Manifests |
| **Shared policy** | Common roles, skills and baseline hooks used across projects | Versioned package, pinned and overridden per project | Helm charts |
| **Factory** | A running instance: agents, sessions, worktrees, dispatcher, router | A machine (local today; cloud or team-shared later) | A running cluster |
| **Toolkit** | Turns policy into a running factory and manages its lifecycle (init, up, down, attach): a substrate plus a control plane | Its own projects | Kubernetes itself |

The factory is the living thing. Policy is what it follows. The toolkit is what builds and runs it.

### The Kubernetes Mapping

| Kubernetes | Factory |
|---|---|
| Container runtime | Substrate (HGT): isolate and run one unit of work |
| Scheduler | Dispatcher: dependencies, conflict sets, concurrency |
| Controllers and reconcile loop | Router, plus restart recovery from git and GitHub |
| etcd (the state store) | GitHub issues and labels, plus git |
| Admission control | The plan gate and the merge gate, by risk tier |
| Manifests | Committed policy |

Where the analogy breaks:

- **Pods are disposable; executors aren't.** Kubernetes heals by replacing a pod. The factory heals by resuming the same session with its context. Executors are closer to a StatefulSet, and that's the hard part.
- **Kubernetes has no human in the loop.** The factory's admission control includes a person wherever the risk tier calls for one.

## Principles

- **Agents decide, scripts act.** Judgment belongs to agents. Side effects go through deterministic, idempotent, logged scripts, and only scripts hold power.
- **State lives in git and GitHub, not in agent memory.** The factory is restartable: kill it, bring it back up from the repo plus GitHub, and nothing is lost.
- **Gates are risk-tiered.** Green CI is necessary, not sufficient. Each tier defines who approves the plan and who approves the merge. The author of a change never approves it.
- **Autonomy is earned and revocable.** A tier's autonomy rises when telemetry shows clean landings, and drops automatically when it degrades.
- **Tickets carry intent, not plans.** Planning happens in a session, on auto by default.
- **Skills are advisory; hooks enforce.** A rule that must hold is backed by a hook or CI, not just a document.

## Risk Tiers

Each project's policy defines its tiers and classifies work into them. The shape:

| Tier | Typical work | Plan gate | Merge gate |
|---|---|---|---|
| **Low** | Mechanical, well-tested, local changes | Auto | Guarded auto-merge, once earned |
| **Medium** | Behavior changes within existing contracts | Auto | Human |
| **High** | Public API, ethos, cross-cutting, security-sensitive | Human approves `plan.md` | Human |

**Guarded auto-merge** requires all of: CI green, agent review passed with no blocking findings, no protected paths touched, and the tier's telemetry within its thresholds.

**Revocation:** when a tier's rework, revert or escaped-defect rate crosses its threshold, its gates tighten one level until a human resets it.

## Roles

| Role | Kind | Job |
|---|---|---|
| **Human** | Person | Approves intent, unblocks stuck sessions, judges gated work, tunes tiers |
| **Planner** | Agent, cycled | Turns intent into tickets sized to fit one session; classifies risk tier; triage |
| **Dispatcher** | Agent plus scripts | Decides what work *starts* and when: dependency graph, conflicting tickets, concurrency limits, priority. Fires the next gate when an artifact is accepted |
| **Router** | Agent plus scripts | Delivers events to work *already running*: a review comment, a red CI run, or an unblock goes into that ticket's live session, resuming it first if it died |
| **Executor** | Agent, durable | Owns one ticket from plan to merge |
| **Reviewer** | Agent | Reviews every change before any merge gate. Never the executor |

The dispatcher and router can be one agent with two script sets; they're separate concerns.

## Unit of Work

Identity is `repo#n`, never a bare `n`, so dependencies can cross repos.

```
issue ──► intent ──► plan.md ──► diff + tests ──► agent review ──► merge gate ──► merge
          (triage)   (plan gate   (same durable session throughout)  (by tier: guarded
                      by tier)                                        auto or human)
```

- **Intent:** the problem, the outcome and the constraints, in the requester's terms. The ticket holds intent, not a plan.
- **Plan:** written by the executor and committed as `plan.md`. Whether it waits for approval depends on the tier.
- **Sizing:** a ticket must fit in one session. Oversized intent is split before it's dispatched.

## Sessions

- **Durable executors.** One Claude session owns a ticket from start to merge, including review iteration. It runs interactively so a human can attach and unblock it at any time.
- **Attach is a protocol, not a UI.** Sessions run in tmux. Humans attach with tmux, a GUI that speaks tmux control mode, or a browser.
- **Crash-only.** Any session can die. Recovery: reattach if it's alive, otherwise resume the named session, otherwise rebuild from git, `plan.md` and the handoff note.
- **Cycled sessions.** The planner, dispatcher and router don't run forever. Before being cycled, a session writes a handoff file; its replacement starts from that.
- **Tension:** session transcripts live on their host. Moving a factory keeps the git state but loses the transcripts unless they're migrated (the Agent SDK's session store may solve this).

## Guardrails

| Layer | When it runs | Example |
|---|---|---|
| **Hook** (Claude Code) | On every edit or command, inside the session; can block | Lint a file on edit; block `tests/` edits during a bug fix; block reads outside the worktree |
| **Git hook** | On commit or checkout | Unicode normalization (HGT) |
| **CI** | On push or PR; the authoritative check | Full lint and test suite, required before any merge |
| **Merge gate** | At merge | Enforced by branch protection and the tier's rules; the executor's identity can never approve |

Carried over from HGT: the frozen, normalized snapshot at `ready` is the trust boundary; executors run sandboxed to their worktree; executors use a machine-user identity with the narrowest possible credentials.

**Isolation:** each factory gets its own tmux server (`tmux -L <factory>`), sandbox, credentials and egress allowlist (the hosts it may reach). No factory sees another's secrets. tmux separation is organization, not security; the sandbox is the boundary.

## Telemetry

Real work is the measurement. Recorded per ticket from the first one, because these numbers can't be recovered afterwards:

- Risk tier, and the gates it passed
- Review rounds
- Commits to `plan.md` after review starts (rework)
- Whether CI passed first time
- Reverts and escaped defects (bugs traced back to a merged ticket)
- Human interventions (`needs-human`, attaching to the session)
- Wall-clock time
- Token usage and cost
- **Policy version:** the commit of the policy files the ticket ran under

Telemetry drives the ratchet: tier thresholds for earning and revoking autonomy are defined against these numbers. Read them as trends, not proof: ticket difficulty and small sample sizes confound them.

**Evals** (behavioral tests for the factory) are deferred. They're only worth their cost for shared policy, once there's shared policy worth protecting.

## Toolkit

From the buy-vs-build research:

- **Substrate (HGT):** the snapshot and trust boundary, the sandbox, machine identity, and session launch.
- **Adopt first-party primitives:** Claude Code named sessions, `--worktree` and `--resume`; the cross-session messaging socket for event injection; the Agent SDK; OTel telemetry tagged with `repo#n` and policy version; plugins for shared policy. Most are in preview, so each sits behind an adapter.
- **Borrow designs:** OpenAI Symphony's spec for the dispatcher; Orchestrator.inc's PR and CI observer for the router; gh-aw's read-only agent with a separately permissioned write job.
- **Build the control plane:** dispatcher, router, ticket ledger, lifecycle (init, up, down, attach), risk-tier gates.
- **Experiments share the substrate.** A fresh toolkit is fine to explore, but never fork the sandbox or the trust boundary.

## Bootstrapping

Every project gets policy plus a factory, including the toolkit itself.

- **The toolkit's factory runs on the toolkit's last release, pinned, never on its own working copy.** Otherwise one bad change bricks the factory that would have fixed it.
- Project policy holds only what's specific to that project. Everything common belongs in shared policy.

## Open Questions

- Where shared policy lives, and confirming plugins as its packaging.
- Spikes before committing: can an srt-sandboxed Claude Code session receive on its messaging socket, and do background sessions coexist with a per-factory tmux server?
- Concrete tier thresholds for earning and revoking auto-merge.
- Cloud or team-shared factories: the attach point, and migrating session transcripts.
- The future of the async (GitHub Actions) executor.
