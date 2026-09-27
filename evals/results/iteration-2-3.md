# Iterations 2 and 3 (2026-09-27)

Skill changes after iteration 1, then reruns of the tasks that showed the problems (with the skill
only; the baseline is unchanged from iteration 1, since the skill is the only difference).

| Change | Why |
| --- | --- |
| Type-check with the TypeScript range the installed Angular requires, never `typescript@latest` | Iteration 1: two runs used TS 5.9, iteration 2: one used TS 7 although Angular 22 requires 6.0 |
| Write the registration as code down to the route entry | Registration appeared only in comments or in an uncalled helper |
| Use NgRx test utilities (`createMockStore`, `provideMockStore`, `provideMockActions`) in Store/Effects specs | Hand-written `Store` fakes |
| `classic-store.md`: `concatLatestFrom` comes from `@ngrx/operators`; the snapshot's Effects example still imports it from `@ngrx/effects` | An agent had to discover the upstream documentation error itself |

| Run | parcel-search-signalstore | classic-store-print-jobs |
| --- | --- | --- |
| Iteration 1, with skill | 8/9 | 9/9 |
| Iteration 1, without skill | 8/9 | 7/9 |
| Iteration 2, with skill (first two changes, first wording) | 9/9 | 7/9 |
| Iteration 3, with skill (all changes), run 1 | — | 9/9 |
| Iteration 3, with skill (all changes), run 2 | — | 9/9 |

Iteration 3 runs installed `typescript@~6.0` from the Angular peer range, registered the state on
the `/print` route in code and tested the effect with `createMockStore`. Iteration 2 showed how much
a single run varies (9/9 in iteration 1, 7/9 in iteration 2 for the same task), so the remaining
tasks should be rerun with the final skill before quoting a new overall pass rate.
