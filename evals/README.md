# Evals

These evals measure whether the skill makes an agent write better NgRx code than the same agent
without it. Each task in `evals.json` runs twice, with the skill and without it, and both runs are
graded against the same expectations.

## Tasks

| Task | What it tests |
| --- | --- |
| `parcel-search-signalstore` | SignalStore with entities keyed by a custom id, debounced cancellable `rxMethod`, route-scoped providers, a spec proving a stale response cannot win |
| `events-plugin-coordination` | Two decoupled SignalStores coordinated through the Events plugin (`withReducer`, `withEventHandlers`, `injectDispatch`) |
| `classic-store-print-jobs` | Classic Store with `createActionGroup`, `createFeature`, functional effects, `concatLatestFrom` from `@ngrx/operators`, polling, route providers, an effect spec with mocks |
| `upgrade-legacy-layers-store` | Upgrading `files/layers-legacy/layers.store.ts` from NgRx 20: `withEffects` → `withEventHandlers` (v21), positional `tapResponse` removed (v22), `concatLatestFrom` moved (v18) |
| `component-local-measure-state` | Choosing not to use the global Store for component-local state |

## Grading

- Expectations marked `[tsc]` are checked by `check-types.mjs`: it resolves the latest stable
  `@ngrx/store`, the Angular major it requires and the TypeScript range that Angular requires,
  installs them into `~/.cache/ngrx-developer-evals/` and runs strict `tsc` over the produced
  files. The toolchain follows new NgRx releases on its own, so an answer written for an older
  major fails exactly where a real project would.
- The remaining expectations are read from the produced code and notes by a grader (a person or
  another agent) that records `text`, `passed` and `evidence` for each one.

```bash
node evals/check-types.mjs <run>/outputs          # human-readable
node evals/check-types.mjs <run>/outputs --json   # for grading.json
```

## Running

Runs go to `evals/workspace/iteration-<n>/eval-<id>-<name>/{with_skill,without_skill}/outputs/`
(ignored by Git). Give both runs the same model and the same rules; only the skill differs:

- the task prompt from `evals.json`, and "there is no existing project; assume a fresh Angular
  workspace with the dependencies the task names";
- write every produced `.ts` file and a `NOTES.md` with the answer to the user into `outputs/`;
  specs use Vitest;
- no web search, web fetch or documentation MCP tools; `npm` commands are allowed, so an agent
  may still inspect package typings;
- the skill run first reads `skills/ngrx-developer/SKILL.md`; the baseline run may not read this
  repository (except a task's input file) and must not have the skill installed.

Model output varies, so compare configurations over several runs before drawing conclusions from
a small difference. Record results per iteration in `results/`.
