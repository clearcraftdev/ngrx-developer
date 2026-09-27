# NgRx Developer Agent Skill

[![skills.sh](https://img.shields.io/badge/skills.sh-ngrx--developer-111827?style=flat)](https://www.skills.sh/kamilfurtak/ngrx-developer/ngrx-developer)

An agent skill for designing, implementing, reviewing, testing, debugging, and migrating Angular state management with NgRx.

It combines concise, agent-oriented guidance with a pinned snapshot of the official NgRx documentation. Agents load the curated references first and use the full documentation snapshot when exact API details, edge cases, or migrations matter.

## Install

```bash
npx skills add kamilfurtak/ngrx-developer --skill ngrx-developer -g
```

To install for a specific supported agent, add its identifier, for example:

```bash
npx skills add kamilfurtak/ngrx-developer --skill ngrx-developer -g -a codex
```

## Update

```bash
npx skills update ngrx-developer -g
```

## Documentation maintenance

The repository checks the latest stable `@ngrx/store` version every day. When a new version is published, the `Update NgRx documentation` workflow downloads the official guide from the package's `gitHead`, updates the pinned version and commit, and runs `scripts/check-skill.mjs` (metadata, snapshot and every reference from the curated files), skills CLI discovery and `git diff --check`.

- A patch or minor release that passes every check is committed to the default branch at once.
- A major release, or a snapshot that breaks a check, opens a pull request instead. Review it: reconcile API and migration changes with the curated `skills/ngrx-developer/references/*.md` files and the version guidance in `SKILL.md`.

Each scheduled run also re-enables the workflow, because GitHub disables scheduled workflows after 60 days without repository activity. The skill itself tells agents to compare the snapshot with the latest npm release and to use the live guide at <https://ngrx.io/guide> when their installed copy is behind.

The repository must enable **Settings → Actions → General → Workflow permissions →
Allow GitHub Actions to create and approve pull requests**. The default token permission
can remain read-only: this updater explicitly requests `actions: write`, `contents: write`
and `pull-requests: write` only for its job. Without the repository setting, GitHub
rejects PR creation. Do not add a personal access token to work around that setting.

To verify the whole path, dispatch `Update NgRx documentation` and inspect every step.
A successful download alone is not a successful update. An unchanged snapshot
legitimately produces no commit and no pull request.

Run the updater manually when needed:

```bash
node scripts/update-ngrx-docs.mjs
```

To check the skill after editing it:

```bash
node scripts/check-skill.mjs
```

To validate a specific version and commit without changing the repository:

```bash
node scripts/update-ngrx-docs.mjs \
  --version 21.1.1 \
  --commit fa0780ee1a4ecd0ceead4566c11795041d5f12e4 \
  --force \
  --dry-run
```

## Included coverage

- `@ngrx/signals`, SignalStore, entity management, RxJS interop, and Events
- classic `@ngrx/store`, Effects, selectors, reducers, actions, and Entity
- ComponentStore, Router Store, NgRx Data, Store DevTools, operators, and schematics
- NgRx ESLint rules, testing patterns, and version migrations
- official NgRx 22.0.1 guide snapshot pinned to commit `a4995391ef631f1bd60d539f436a1aa5c23c4fe5`

## Repository layout

```text
skills/ngrx-developer/
├── SKILL.md
├── agents/openai.yaml
└── references/
    ├── *.md
    └── guide/
```

The skill follows the open [Agent Skills specification](https://agentskills.io/specification) and is discoverable by the [skills CLI](https://github.com/vercel-labs/skills).

## Licensing

The skill instructions and curated references are licensed under the repository MIT license. The bundled NgRx documentation remains under the NgRx MIT license included at `skills/ngrx-developer/references/ngrx-license.txt`.

This project is not affiliated with or endorsed by the NgRx team.
