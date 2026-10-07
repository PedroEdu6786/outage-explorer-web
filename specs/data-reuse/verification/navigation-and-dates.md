# Navigation metadata and date submission correction — October 7, 2026

## Outcome and scope

Production previously deduplicated pending catalog reads but discarded completed
responses. Both ProductionProvider and default live composition now inject the
same catalog policy: one entry, 256 KiB UTF-8 serialized JSON, reuse until reload
or explicit invalidation. Every decoded response is measured at admission;
oversized successful responses remain usable without retention. Session/access
cleanup, denials and successful Admin publication retain their existing guards.
The October 7 user request authorizes enabling; historical disabled-policy records
remain dated evidence. Observation rows and SQL page reads keep existing behavior.

Overview date inputs now edit a draft. Current results, chart and Explore dataset
handoff continue using the applied dates. Apply dates submits a valid changed
range; invalid, unchanged and intermediate edits make no request. Open bounds
remain valid. Dataset Explorer already required Apply filters.

## Revision and checks

- Base revision: `21760b98d4083d725514a565c054b3567823e090` plus this change.
- SHA-256 of sorted tracked `src/` and `tests/` paths and contents (each separated
  with NUL): `75a958f20f24e4d5caaf255427869dc2b95cf311f1f858ed3556118a7c624a78`.
- `npm test`: 30 files / 387 tests passed. Existing handoff/loading tests now
  apply dates deliberately; new regression covers intermediate/reversed drafts,
  unchanged submission, table/chart identity and applied-range navigation.
- `npm run typecheck` and `npm run lint`: passed.
- `npm run test:boundaries`: 33 tests passed; `npm run check:boundaries`: passed.
- `npm run build` and `npm run check:release-boundaries`: passed; fresh configured
  Next output scanned (193 emitted files). No fixture leakage detected.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npx playwright test --config playwright.controlled.config.ts --workers=1`:
  five passed. Actual Next routes with synthetic intercepted HTTP show **one**
  catalog GET through Overview → Explorer → SQL → Explorer → Overview → SQL for
  both Analyst and Admin. Multiple date edits add **zero** preview reads before
  Apply dates. Overview table pagination remains local; SQL executes once.
- `npm run build-storybook`: passed with existing module-directive warnings.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e -- tests/browser/overview-page.spec.ts tests/browser/feature-harness.spec.ts tests/motion/entrances.spec.ts --workers=1`:
  30 passed. First sandbox attempt could not bind port 6007; permitted retry passed.
- `git diff --check`: passed. Generated `next-env.d.ts` change restored.

## Evidence limits

Controlled data is synthetic; no authenticated live backend catalog-size,
permission-change or request-trace acceptance is claimed. Catalog runtime
admission enforces the selected budget independently of a preflight measurement.
Existing published Figma Overview reference and component inventory were reviewed;
the added Apply dates button is an intentional interaction extension using shared
controls. No refreshed screenshots or new visual sign-off is claimed. Broader
row retention and original live/visual release gates remain open.
