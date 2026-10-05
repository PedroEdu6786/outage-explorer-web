# Tasks: Tokens and atoms
> Status: complete; atomic checkpoint accepted · Slug: web-client · Plan phase: 2 · Manifest: ../tasks.md · Spec: ../spec.md

- 7 tasks; all accepted below. Paths are repository-relative planned additions unless noted in the manifest.
- Dependencies name completed tasks or explicit external readiness subgates. `[P]` permits concurrency only with disjoint ready work; it never waives predecessors.

- [x] **T2.1** Map observed tokens and available font assets into Tailwind styles — `src/styles/tokens.css`, `src/app/globals.css`, `src/app/layout.tsx`, `docs/specs/web-client/token-map.md` (FR1, FR17, TR1, TR10)
  - Owner: **Foundation**. Depends: **T1.2, T1.3**.
  - Acceptance: Map evidence colors, spacing, type, radii and shell dimensions to consumers; document readable-type/focus extensions and font provenance. Do not create an exhaustive unused scale.
- [x] **T2.2** [P] Add evidenced action and link primitives — `src/components/atoms/Button.tsx`, `src/components/atoms/IconButton.tsx`, `src/components/atoms/Link.tsx`, `src/components/atoms/actions.stories.tsx` (FR1, FR17, TR2, TR10)
  - Owner: **Atoms-actions**. Depends: **T2.1, T1.4**.
  - Acceptance: A1: typed variants, loading/disabled behavior and accessible names/focus; native links/buttons retain correct semantics.
- [x] **T2.3** [P] Add reusable form-control primitives — `src/components/atoms/Input.tsx`, `src/components/atoms/Select.tsx`, `src/components/atoms/Textarea.tsx`, `src/components/atoms/Checkbox.tsx`, `src/components/atoms/controls.stories.tsx` (FR1, FR17, TR2, TR10)
  - Owner: **Atoms-controls**. Depends: **T2.1, T1.4**.
  - Acceptance: A2: labels/descriptions can associate by ID; keyboard and disabled/invalid states work. Use a native checkbox for compare unless evidenced interaction requires a switch.
- [x] **T2.4** [P] Add status and surface primitives — `src/components/atoms/Badge.tsx`, `src/components/atoms/Spinner.tsx`, `src/components/atoms/Surface.tsx`, `src/components/atoms/status.stories.tsx` (FR1, FR16, FR17, TR2, TR10)
  - Owner: **Atoms-status**. Depends: **T2.1, T1.4**.
  - Acceptance: A3: visual tones carry no role authority; loading has suitable accessible text. Use semantic separators/text directly when a wrapper adds no reusable contract.
- [x] **T2.5** [P] Preserve visible logo and icon assets with provenance — `src/components/atoms/BrandMark.tsx`, `src/components/atoms/Icon.tsx`, `src/components/atoms/brand.stories.tsx` (FR1, TR10)
  - Owner: **Design**. Depends: **T1.3, T2.1, T1.4**.
  - Acceptance: A1/S1/V1 vectors match inspected sources and expose decorative/meaningful semantics; do not substitute unknown PNGs. Record unresolved authoritative export as blocked affected asset, never invent a replacement.
- [x] **T2.6** Verify meaningful atomic interactions and design mapping — `tests/components/atoms.test.tsx`, `tests/visual/atoms.spec.ts` (FR1, FR17, TR2, TR10)
  - Owner: **Foundation**. Depends: **T2.2, T2.3, T2.4, T2.5**.
  - Acceptance: Check names, focus, loading/disabled semantics and observed variants. Avoid tests duplicating class implementation; record design comparison and accessibility deviations.
- [x] **T2.C** Checkpoint: accept reusable atomic vocabulary — `docs/specs/web-client/verification/phase-2.md` (FR1, FR17, FR19, TR1, TR2, TR10, AC1, AC17, AC19)
  - Owner: **Foundation**. Depends: **T2.6**.
  - Acceptance: Accept only mapped A1–A3 variants with actual consumers. Feature readiness uses required descendants, not this whole-phase gate when unrelated work is pending.
