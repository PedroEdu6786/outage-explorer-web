# Module ownership and production boundaries

T1.10 implements FR18/FR19 and TR2/TR3/TR6/TR8/TR9. Bootstrap checks establish
source/artifact exclusion; they do not approve session transport or a release.

| Paths / public seam | Writer | Consumers |
| --- | --- | --- |
| Package files, root configuration, check scripts | Foundation | All lanes request shared changes |
| `src/components/atoms`, `molecules`, shared `organisms`, `templates` | Foundation/UI assignment | UI layers compose lower layers; templates arrange slots |
| Tokens, global styles, root layout | One coordinator-assigned Design/Foundation writer | Explicit transfer at T2.1 |
| `src/contracts/*.ts` | Integration | Public frontend operation/value models only |
| `src/session/*` | Integration | Feature controllers and injected composition |
| `tests/fixtures/*` | Integration; Foundation owns `sentinels.ts` | Isolated stories/tests only |
| `src/features/<lane>/index.ts` | The assigned feature lane | Public feature entry; siblings cannot import internals |
| `src/adapters/live/*`, `src/integration/*`, `src/composition/*` | Integration | Agreed live adapters and production registration |
| Product routes and protected shared layouts | Assigned page lane / shared wiring owner | Thin composition after the page-assembly gate |
| Task checkboxes and execution ledger | Coordinator | Workers report evidence; no concurrent edits |

Actual dispatch assignments in `execution-state.md` take precedence over this
general map. Shared barrels have one writer. Each feature can change its internal
modules while preserving accepted consumed contracts. Hooks/services own state
and workflows; adapters own HTTP decoding; shared UI imports neither. Atoms cannot
import molecules/organisms/templates, molecules cannot import organisms/templates.
Contracts stay independent of implementation modules. Features depend on injected
operations rather than routes or HTTP adapters. Shared session code cannot depend
on feature or production composition.
Contract modules cannot import packages (including React, Next or Zod), even
when those packages are otherwise approved production dependencies.
Shared organisms/templates may consume frontend presentation contracts such as
`src/contracts/table.ts`; atoms/molecules remain independent of product contracts.

## Executable checks

`npm run check:boundaries` parses TypeScript/JavaScript module dependencies,
including reexports, type imports, literal dynamic imports and `require` calls.
It resolves local aliases through the current TypeScript configuration and checks
every transitive import from `src/app`, `src/composition` and `src/integration`. Unreferenced production
source also obeys layer rules; `.stories`, `.test`, `.spec` and isolated test/demo
directories do not become production roots. Production source cannot reach them.
Non-literal module loading, runtime evaluation, unresolved imports, repository
escapes and unapproved dependency packages fail closed. Direct EIA/storage/database
packages and addresses are rejected; the presentation tier does not own them.
This is a static policy check, not proof of backend authorization or arbitrary
runtime network behavior. Computed network URLs and third-party package internals
require code review and eventual integration evidence.
The bounded module-loading policy rejects `node:module`/`createRequire` loaders,
`require` aliases and direct/member `eval`/`Function` invocation, and traverses
TypeScript import-equals declarations. It is not a generalized JavaScript code
execution security scanner; semantic indirection beyond these checked forms
still requires code review.

`npm run check:production-fixtures` requires an actual Next build, traverses the
source graph and scans emitted client/server JS, JSON, HTML, CSS, maps and serialized
output for known fixture signatures. It requires nonempty client/server JS and
valid manifest assets. Fixture signatures derive from `tests/fixtures/sentinels.ts`,
including values already used by the synthetic adapters. Missing signatures alone
never substitute for source reachability. Generated cache/diagnostic records are
excluded; Storybook output is intentionally outside `.next`.
The artifact checker scans the existing build; it does not prove that output is
fresh for the current source. Acceptance must run a fresh serialized build and
bind its source revision or digest to the check evidence. Do not use an older
passing artifact scan after changing source.

`npm run test:boundaries` uses independent temporary trees to test transitive/alias
fixture contamination, dynamic/unresolved loads, sibling internals, layer violations,
direct source/storage access, artifact contamination and missing build assets.
Temporary inputs never modify production files or shared outputs.

`npm run check:release-boundaries` adds `--require-live` to both checks. It fails
closed until `src/composition/production-operations.ts` exports an explicit
`productionRegistration` with `status: "ready"`. Unavailable placeholders cannot
pass merely by existing. This structural marker establishes only the registration prerequisite; accepted live contracts, runtime failure behavior and
live integration still require T5/T6/T7 evidence. At T1.10 the release check is
expected to fail and bootstrap checks can pass. No production fixture selector
or mock fallback is authorized.

## T1.10 bootstrap evidence

`npm run test:boundaries` passed 31 independent checks. `npm run lint` and the
current `npm run build` passed. `npm run check:boundaries` traversed 12 source
modules and one production root. `npm run check:production-fixtures` passed its
source audit and scanned 49 emitted files from that build. The separate
`npm run check:release-boundaries` failed as expected because production operation
registration is absent. Fixture/live behavior and design fidelity remain separate;
this evidence does not establish release acceptance.
