# Flotr2 3.0 Renovation Plan

## Ethos

3.0 is a retro library: authentically 2011, verifiably correct.

| Decision | Choice |
|---|---|
| Period | 2011 |
| Browser floor | IE9+ (native canvas; excanvas, canvastext and the IE build are dropped) |
| Language | ES5 |
| Runtime dependencies | None (underscore and bean removed) |
| Distribution | UMD; `window.Flotr` global kept |
| Build | Makefile: concatenate and minify (smoosh removed) |
| Tests and lint | Modern (Playwright, ESLint), configured to enforce the period |
| Style | Airbnb ES5 (see [STYLEGUIDE.md](STYLEGUIDE.md)) |
| Version | 3.0, with a `2.x` branch kept for IE8 users |

## Phases

Each phase stays green against the visual golden master. No big-bang rewrite.

### 0. Foundations
- Write this plan and the style guide.
- Rewrite `CLAUDE.md` to match the ethos (it still says IE8, underscore).

### 1. Issue Triage
116 open issues and 13 open PRs. Sort each into a bucket:

| Bucket | Fate |
|---|---|
| Fixed by renovation (e.g. #338 CVE, #257 globals, #263 RequireJS, #283 destroy) | Close when the fix lands, linking the commit |
| IE6–8 specific | Close as out of scope, pointing to `2.x` |
| Stale browser-version bugs | Reproduce, otherwise close |
| Support questions | Close politely |
| Real bugs (~40; mouse tracking is the largest cluster) | Becomes a failing test in phase 2 |
| Feature requests (~30) | Accept or decline against the ethos |

Closing issues is public: drafts are reviewed before anything is posted.

### 2. Tests
- Seed or remove `Math.random` in existing specs.
- Canvas call recorder: wrap `CanvasRenderingContext2D` and snapshot draw calls as JSON, for every type and plugin.
- Behavioral specs via the public API: axis ticks (including time mode), option merging, event payloads (`flotr:hit`, `flotr:click`, selection), legend, `destroy()`, null/empty/negative data.
- A failing test for each real bug from triage.

### 3. Style
- Add ESLint (Airbnb ES5, `ecmaVersion: 5`, compat for `ie 9`).
- Apply it in one mechanical commit, recorded in `.git-blame-ignore-revs`. No logic changes in that commit.

### 4. Build
- Replace smoosh with a Makefile (concatenate, UMD wrap, minify).
- Stop committing build artifacts to the repo root.
- Fix `package.json`: version, `private`, `main`.
- Golden master must show identical rendering before and after.

### 5. Dependencies
- bean: replace with an internal emitter for `flotr:*` events that keeps the handler signature `fn(arg1, arg2)`. Use native listeners for DOM events. Drop the Prototype `Event.fire` hack.
- underscore: replace one file at a time with native ES5 or small local helpers. Watch `_.each` over objects, and the shallow `_.clone` behavior that `Flotr.merge` depends on.
- Delete the unused vendored libs in `lib/`.

### 6. Refactor
- Break up `Graph.js` (options, layout and axes, rendering, interaction).
- Then types and plugins.
- Keep `addType`, `addPlugin` and the lifecycle hooks as the public contract.
- Fix the real bugs from triage, closing issues as fixes land.

### 7. Release
- Migration notes: IE6–8 dropped, `Flotr._` and `Flotr.bean` removed, build file changes.
- Tag 3.0 and cut the `2.x` branch.

## Factory Rollout

Flotr2 is the first worked example of the software factory ([VISION.md](VISION.md), [FACTORY.md](FACTORY.md)).

1. **Phases 0–2** (foundations, issue triage, test backfill) run in a single interactive session with subagents. This is discovery work, and it doesn't wait for the factory to be built.
2. Telemetry is recorded from the first ticket.
3. Later phases move to the factory as it comes online: intent-only tickets, durable executors, and a dispatcher that's aware of the dependency graph.
4. The style commit and the `Graph.js` split are points where all other work has to wait.
5. Starting risk tiers:
   - **Low:** formatting, tests, mechanical replacement of underscore calls.
   - **Medium:** bug fixes and internal refactors.
   - **High:** public API, the ethos, and the event adapter.

## Open Questions
- Are breaking `Flotr._` and `Flotr.bean` acceptable for 3.0?
- What happens to the examples site and `flotr2.examples.*` builds?
- Is the AMD-only `flotr2.amd.js` build still shipped separately, or folded into UMD?
