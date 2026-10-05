# Outage Explorer web client — Decision Records

The Chair synthesized revised proposals after six independent critiques, three author responses and a focused closure round. “Closed” means the plan addresses the objection, not that implementation checks have passed. No user requirement was put to a vote.

## D1 — Deliver shared metadata/session seams before the feature fork

- **Context:** Explorer and SQL both need authorized catalog/schema, and all features need session context.
- **Options considered:** Dataset lane implements the public catalog as features proceed; shared prerequisite contracts plus executable fixtures before consumers begin.
- **Arguments for:** gamachiel (Architect) assigns one catalog authority; rafachafa (Pragmatist) and estebanquito (Engineering Manager) require availability without sibling-controller dependency.
- **Original argument retained verbatim, gamachiel:** “Dataset lane: authorized catalog, schema and snapshot-bound previews. Its public catalog operation also supplies authorized metadata to SQL without SQL importing dataset controller internals.”
- **Verdict:** Integration owner owns the public catalog/session contract and initial fixtures; Explorer and SQL independently consume the completed seam. Production implementation ownership cannot create an undeclared SQL dependency. Consensus after revision. (FR6–FR7, FR19; TR8)
- **Who ticked:** gamachiel — “tick tick tick. Concede the ownership ambiguity.” rafachafa and kings also conceded missing explicit ownership.
- **Dissent kept:** No unresolved dissent. The original single-catalog-authority argument remains valid; availability moved earlier.
- **Revisit trigger:** A genuine new consumer requires changing the public seam; update dependent acceptance checks rather than adding a universal metadata platform.

## D2 — Per-lane feature starts, global final page gate

- **Context:** Atomic-first must enable useful parallel work while respecting pages-last.
- **Options considered:** Whole-foundation barrier; per-lane readiness including early pages; per-lane component readiness plus one final page gate.
- **Arguments for:** kings (Product) opposes blocking auth behind unrelated tables/charts; rafachafa and gamachiel oppose pages before shared seam proof; estebanquito requires exact predecessors.
- **Original argument retained verbatim, kings:** “No global feature-completion barrier beyond each lane’s actual shared prerequisites.”
- **Verdict:** Each feature starts after its own accepted atomic/component and shared-contract prerequisites. All four feature checkpoints plus the composed harness must pass before any individual product page begins; page tasks may then run concurrently. Consensus. (FR19, FR21; TR8)
- **Who ticked:** kings — “tick tick tick. I concede that the wording could start product-page assembly before all four feature checkpoints pass, contrary to ‘pages last.’” rafachafa conceded a foundation-wide gate delays unrelated lanes.
- **Dissent kept verbatim, kings:** “My original objection to a global barrier remains only for starting independent feature work; it does not apply to the final page gate.”
- **Revisit trigger:** User explicitly changes the pages-last constraint or a new prerequisite is demonstrated, not merely a preference for another delivery style.

## D3 — Per-operation live-contract readiness is a real gate

- **Context:** Fixture seams are not agreed HTTP/session contracts.
- **Options considered:** Begin live adapters “when available”; require a recorded operation contract and responsible owner before each adapter.
- **Arguments for:** ponykiller (Infra) identifies version/session/expiry mismatch risks; all three authors concede.
- **Prior limitation retained verbatim, rafachafa:** “Live transport agreement remains the principal release dependency.” This acknowledged risk did not define readiness evidence.
- **Verdict:** Record backend environment/version, responsible integration person, operation request/response/error/encoding/authorization and applicable auth/session decisions; SQL adds limits/TTL/delivery/outcome semantics. Gate affected live work only. Fixture features/pages continue; release requires all live evidence. Consensus. (TR3, TR5, TR7, TR9)
- **Who ticked:** rafachafa — “tick tick tick. ‘When backend agreement exists’ is not an executable gate.” gamachiel and kings also conceded.
- **Dissent kept:** No unresolved dissent; actual Q2/Q3 inputs remain open rather than fabricated.
- **Revisit trigger:** A versioned backend contract becomes available or changes incompatibly.

## D4 — Fixture isolation is structural and verified in production output

- **Context:** A runtime selector or synthetic banner can still ship fixture rows/personas.
- **Options considered:** Runtime fixture flag; isolated test composition with production import/output verification.
- **Arguments for:** cuid (Risk & Verifiability) requires proof of exclusion beyond UI labeling; authors agree after critique.
- **Original risk statement retained verbatim, cuid:** “A shared seam and visible synthetic banner do not establish that production cannot import fixture implementations or activate demo identity. None identifies the verification artifact proving exclusion.”
- **Verdict:** Separate Storybook/test composition root, no transitive fixture/demo identity imports from production, fail-closed configuration, import graph plus emitted-asset sentinels, and production-mode backend-failure test. Marker absence alone is insufficient. Consensus. (FR18; TR6, TR9; AC18)
- **Who ticked:** gamachiel — “tick tick tick. Concede that an abstract ‘explicit fixture mode’ is insufficient.” rafachafa and kings also conceded.
- **Dissent kept:** None unresolved. This adds targeted evidence, not a general security platform.
- **Revisit trigger:** Build/composition changes alter import reachability or fixture delivery.

## D5 — One identity/access generation guards all asynchronous outcomes

- **Context:** Aborted fetches and cleared result state do not guard already-resolved callbacks or late errors.
- **Options considered:** Per-feature cancellation/result clearing; shared generation check covering every publication and error side effect.
- **Arguments for:** cuid identifies Analyst → logout → Viewer metadata restoration and stale 401 invalidating the new session.
- **Original narrower argument retained verbatim, gamachiel:** “Feature requests capture the current generation and discard responses after it changes.” The revision makes errors, metadata, autocomplete and handoffs explicit.
- **Verdict:** Invalidate on logout/identity change/access reduction; guard successes, errors and intents before state/global effects. Prove composed races with the same runtime, then separately prove backend enforcement. Consensus. (FR4–FR6, FR21; TR6)
- **Who ticked:** gamachiel — “tick tick tick. Concede the response-guard underspecification.” All authors accepted the common contract.
- **Dissent kept:** None unresolved; no global query cache is introduced.
- **Revisit trigger:** New protected async publisher or multi-session behavior needs coverage.

## D6 — A lost execute response is an unknown outcome

- **Context:** Browser transport failure does not prove the backend did not run SQL.
- **Options considered:** Generic failure/retry; explicit uncertain outcome and deliberate new execution.
- **Arguments for:** ponykiller distinguishes backend execution deadline from network delivery and warns against a false safe-replay promise.
- **Original risk statement retained verbatim, ponykiller:** “‘No automatic retry’ is necessary but insufficient when the execution request may have reached the backend and its response is lost.”
- **Verdict:** Preserve safe context, explain uncertainty, never invent cancellation/lookup/query ID; a new deliberate Run is a new execution and may be busy. Consensus. (FR12–FR16; AC16)
- **Who ticked:** rafachafa — “tick tick tick. A failed execution response does not establish that execution failed.” All authors accepted the correction.
- **Dissent kept:** None unresolved; lookup/reconciliation can be added only if an agreed backend contract supplies it.
- **Revisit trigger:** Backend offers verified idempotency or execution reconciliation.

## D7 — Exact-value and execution-call evidence belongs in shared scenarios

- **Context:** Broad “precision preserved” and “one execution” claims can pass superficial demos.
- **Options considered:** Isolated happy-path examples; shared adversarial values and call traces across interactions.
- **Arguments for:** cuid requires exact card/table/tooltip decimal ties and request-level proof through paging/focus/expiry; all authors agree.
- **Original risk statement retained verbatim, cuid:** “A chart tooltip rounds a decimal tie through binary numbers although the table is correct; SQL pagination after a draft edit submits the new draft, or focus triggers execution.”
- **Verdict:** One adversarial fixture family plus observable execute/page logs; precision checks distinguish exact labels from plotting coordinates; live traces are separate. Consensus. (AC10–AC16, AC20)
- **Who ticked:** rafachafa — “tick tick tick. Shared adversarial fixtures are necessary evidence, not duplicated test infrastructure.”
- **Dissent kept:** None unresolved. These are test contracts, not production abstractions.
- **Revisit trigger:** New rendering format or execution lifecycle changes the observable contract.

## D8 — Cross-feature harness is a mandatory predecessor, not optional mitigation

- **Context:** B mentioned early handoff tests but omitted their explicit phase gate.
- **Options considered:** Independent feature acceptance directly to pages; required composed harness.
- **Arguments for:** kings, estebanquito and ponykiller identify cross-view draft replacement and delayed state restoration.
- **Original mitigation retained verbatim, gamachiel:** “Late route assembly could expose handoff conflicts; exercise public handoff contracts inside fixture previews first.”
- **Verdict:** Make this an owned phase 5 checkpoint before phase 6 pages; it uses real feature controllers with shared session/catalog fixtures. Live API completion remains a separate gate. Consensus. (FR4–FR6, FR19, FR21)
- **Who ticked:** gamachiel — “tick tick tick. Concede that a mentioned mitigation is weaker than an acceptance gate.”
- **Dissent kept:** None unresolved. This reinforces D2 without requiring infrastructure deployment.
- **Revisit trigger:** Additional view or shared workflow introduces another composed seam.

## Over-engineering audit

- Retained: Storybook → FR19; runtime validation → TR7; positional table → FR15; session generation → FR4–FR6; cross-view harness → FR19/FR21; bounded national SVG chart → FR20; fixture-output audit → FR18/TR6.
- Cut: full component platform, global domain/cache store, generic pagination controller, SQL parser/engine, saved queries, additional charts, hosting/provisioning and observability platform.
- Deferred with triggers in spec: Admin UI/new-data card and expanded editor/chart tools. No unused component is justified solely by an atomic category.
