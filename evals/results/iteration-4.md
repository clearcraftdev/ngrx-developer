# Iteration 4 (2026-09-27): the skill after all fixes

Tasks 2, 4 and 5 rerun with the skill as of commit 594787e; tasks 1 and 3 come from iterations 2
and 3, which already included the TypeScript and registration guidance (task 3 ran twice). The
baseline is iteration 1 without the skill.

| Task | With skill (final) | Without skill |
| --- | --- | --- |
| parcel-search-signalstore | 9/9 (iteration 2) | 8/9 |
| events-plugin-coordination | 7/7 | 6/7 |
| classic-store-print-jobs | 9/9, 9/9 (iteration 3) | 7/9 |
| upgrade-legacy-layers-store | 6/6 | 6/6 |
| component-local-measure-state | 5/5 | 5/5 |
| **Pass rate** | **100% (36/36)** | **89% (32/36)** |

Every final run installed `typescript@~6.0` from the Angular peer range. `check-types.mjs` now also
installs `@vitest/browser`, since the snapshot's component-testing pattern imports
`@vitest/browser/context`.

Caveats: one run per task (two for task 3) and a baseline from a single run; the upgrade and
component-state tasks pass without the skill as well, so the difference comes from the three
tasks that test NgRx idioms. Iteration 2 showed a 9/9 → 7/9 swing on one task between runs.
