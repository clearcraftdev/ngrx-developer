# Iteration 1 (2026-09-27)

One run per task and configuration, same model for both, NgRx 22.0.1 / Angular 22.2.0 /
TypeScript 6.0.3 as the type-check toolchain. Both configurations could use `npm` (and did:
every run installed the packages and read their typings); neither could use the web.

| Task | With skill | Without skill |
| --- | --- | --- |
| parcel-search-signalstore | 8/9 | 8/9 |
| events-plugin-coordination | 7/7 | 6/7 |
| classic-store-print-jobs | 9/9 | 7/9 |
| upgrade-legacy-layers-store | 6/6 | 6/6 |
| component-local-measure-state | 5/5 | 5/5 |
| **Pass rate** | **97% (35/36)** | **89% (32/36)** |

Mean time 677 s with the skill and 693 s without; mean tokens 101k and 93k.

## Observations

- Every answer type-checks against the latest NgRx in both configurations. An agent that may run
  `npm` finds `withEventHandlers`, the object form of `tapResponse` and the `@ngrx/operators`
  imports from the typings, so compilation alone does not separate the configurations.
- The differences are NgRx idioms the typings do not enforce: without the skill the agent used
  `withLatestFrom` instead of `concatLatestFrom`, `catchError` instead of `mapResponse` or
  `tapResponse`, and tested a functional effect with hand-written fakes instead of NgRx's mock
  store.
- Both configurations described route-scoped providers only in comments on the parcel search
  store; the expectation fails for both.
- The upgrade and component-state tasks do not discriminate: both configurations pass them fully.
- Two runs with the skill type-checked with TypeScript 5.9 although Angular 22 requires 6.0.
- One run per configuration is too few for firm conclusions; repeat before relying on the delta.
