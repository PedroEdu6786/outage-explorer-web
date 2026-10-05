# Pinned web-client toolchain

T1.1, checked October 4, 2026. Registry metadata and official compatibility
documentation determine these choices; the prototype does not determine versions.
All direct dependencies use exact versions. `package-lock.json` fixes the
transitive graph; reproduce it with `npm ci` rather than resolving `latest`.

| Tool | Pin | Reason |
| --- | --- | --- |
| Node.js | 24.18.0 | Supported Node 24 LTS; matches the installed runtime |
| npm | 11.16.0 | Matches the installed package manager; supports Node 24 |
| Next.js | 16.3.8 | Stable release; Node >=20.9 and React 19 supported |
| React / React DOM / React type packages | 19.3.0 | Matching stable runtime/type releases; supported by Next and Storybook peers |
| TypeScript | 5.9.3 | Next requires >=5.1; typescript-eslint 8.71.0 requires >=4.8.4 <6.1.0, excluding registry-latest TypeScript 7.0.2 |
| Tailwind / Tailwind PostCSS integration | 4.3.3 | Matching release pair using the official v4 Next.js integration |
| PostCSS | 8.5.28 | Stable PostCSS 8 integration |
| Storybook / Next.js Vite framework | 10.6.1 | Same release; framework peers support Next 16, React 19 and Vite 8 |
| Vite / React plugin | 8.3.2 / 6.1.1 | Plugin peers require Vite 8; Node 24 satisfies both engines |
| Vitest | 5.0.3 | Supports Node 24 and Vite 8; behavior tests independent of routing |
| React Testing Library / DOM | 16.3.3 / 10.4.2 | RTL supports React 19 and requires DOM 10 |
| jest-dom / user-event | 7.0.1 / 14.6.7 | Vitest matchers and realistic DOM interaction helpers |
| jsdom | 30.1.2 | DOM test environment; requires Node >=24.15 within Node 24 |
| Playwright | 1.63.0 | Supported Node >=20; browser/routing checks complement unit tests |
| Zod | 4.6.5 | Runtime decoding at adapter boundaries, separate from frontend models |
| ESLint / @eslint/js | 10.12.0 / 10.0.1 | Current supported flat-config major |
| typescript-eslint | 8.71.0 | Supported ESLint 10 and TypeScript 5.9 peer combination |
| Node types | 24.19.1 | Node 24 API major rather than registry-latest Node 26 types |
| server-only | 0.0.1 | Explicit server-module import guard for later live composition |

The observed host is macOS 26.5.2, Darwin arm64. `node --version` returned
`v24.18.0`; `npm --version` returned `11.16.0`; both binaries came from
`~/.nvm/versions/node/v24.18.0/bin/`. `.nvmrc`, `engines` and
`packageManager` record this reproducible baseline. npm's `engines` field alone
does not enforce runtime selection; select `.nvmrc` before installation.

## Reproduction

```sh
nvm install
nvm use
node --version
npm --version
npm ci
npm ls --depth=0
```

Bootstrap scripts are declared in `package.json`; framework configuration and
the isolated test roots are delivered by T1.2 and T1.4. T1.1 does not claim a
build, lint, behavior, browser, live-integration or visual-comparison pass.
Playwright browser binaries are installed separately once its smoke harness is
configured: `npx playwright install chromium`. No browser download is an
application dependency.

Version-selection metadata can be reproduced with:

```sh
npm view next@16.3.8 engines peerDependencies --json
npm view @storybook/nextjs-vite@10.6.1 peerDependencies --json
npm view vitest@5.0.3 engines peerDependencies --json
npm view @vitejs/plugin-react@6.1.1 engines peerDependencies --json
npm view typescript-eslint@8.71.0 peerDependencies --json
npm view @testing-library/react@16.3.3 peerDependencies --json
npm view jsdom@30.1.2 engines --json
npm view npm@11.16.0 engines --json
```

## Official compatibility sources

- [Node release support](https://nodejs.org/en/about/previous-releases) identifies Node 24 as LTS.
- [Next installation](https://nextjs.org/docs/app/getting-started/installation) documents Node and TypeScript minima.
- [Storybook Next.js Vite framework](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite) is the recommended isolated integration.
- [Vitest installation](https://vitest.dev/guide/) documents supported Node/Vite baselines.
- [Tailwind with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs) documents the PostCSS integration.
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) documents DOM-oriented component testing.
- [Playwright installation](https://playwright.dev/docs/intro) documents browser setup and system requirements.
- [Zod documentation](https://zod.dev/) documents strict TypeScript and runtime schemas.
- [typescript-eslint supported versions](https://typescript-eslint.io/users/dependency-versions/) documents compiler/linter compatibility; the versioned npm peer metadata above constrains the selected release.

Package publishers' versioned npm `engines` and `peerDependencies` supplement
documentation pages that may advance after this selection. Dependency-tree
validation establishes package compatibility only; later tasks supply execution
evidence and preserve separate fixture, live and visual reports.

Next's `eslint-config-next@16.3.8` was evaluated and excluded: its React plugin
requires ESLint <=9, while [ESLint 9 is end-of-life](https://eslint.org/version-support/).
The supported baseline uses ESLint 10 with strict TypeScript rules. It does not
claim Next-specific or React-specific lint rule coverage; framework compilation,
TypeScript, behavioral tests and boundary checks complement that baseline.
The initial candidate install's five high audit entries all traced to the
Next lint plugin's `fast-glob`/`micromatch`/`braces` development dependency chain.
No forced audit fix or framework downgrade was applied.

## T1.1 execution evidence

The final clean `npm install` completed with 349 packages added and reported
zero vulnerabilities. `npm ls --depth=0` and the complete `npm ls --all` tree
both passed with no invalid/missing peers. CLI probes returned Next 16.3.8,
TypeScript 5.9.3, ESLint 10.12.0, Vitest 5.0.3 and Playwright 1.63.0.
An esbuild synchronous TypeScript transform passed, confirming its installed
native binary works despite npm's pending install-script notice.

The upstream `tsconfck@3.1.6` deprecation remains within the Storybook adapter
dependency graph; it is not an incompatible runtime peer. Build and test smoke
execution remain the following tasks' evidence.

## T1.2 bootstrap evidence

The minimal server root layout, strict compiler configuration, Tailwind PostCSS
integration and strict TypeScript ESLint flat configuration are established.
No product `page.tsx` exists. Next emits its internal static `/404` route without
requiring a custom not-found page. No session transport, credential forwarding
or public configuration has been invented; `next.config.ts` executes server-side.

The default Turbopack build failed because its PostCSS worker attempted to bind
an internal local port (`EPERM`), including the approved escalated retry. The
supported `next build --webpack` alternative passed, so `dev` and `build` now
select webpack explicitly for this runtime. This does not select an application
hosting provider or change the source architecture. `npm run build`,
`npm run typecheck` and `npm run lint` passed on the bootstrap. Asset fidelity,
behavior tests and live integration are still separate later gates.
`typecheck` generates Next's route types before invoking TypeScript so a clean
checkout does not require a production build first.

## T1.4 isolated-tooling evidence

Storybook uses the official `@storybook/nextjs-vite` framework with an App Router
preview parameter and a visible synthetic-data label. Its test-only smoke story
is rooted in `tests/tooling/`; production routes import neither its component nor
the preview. Vitest uses React Testing Library with jsdom and explicit cleanup.
Playwright runs the built Storybook on its own local static server at port 6007;
the Storybook development command owns port 6006. Product pages are not involved.

`npm run build-storybook` passed. The two RTL smoke checks passed (keyboard
activation and clean render state). `npm run typecheck` and `npm run lint` passed
including `.storybook` files. `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e`
passed its Chromium smoke check with no page errors. The browser runtime was
downloaded to temporary storage with the same environment variable; an ordinary
developer can instead run `npx playwright install chromium` and omit the variable.
Local-server/browser execution required approved escalation after sandbox `EPERM`.

Storybook emitted non-failing warnings about currently empty production-story
globs, upstream Next `use client` directives during Vite bundling, a large preview
chunk, and inability to persist user-global settings in the sandbox. The tested
preview still rendered and handled keyboard input. This proves the isolated
toolchain, not product behavior, fidelity or live integration. `type: module`
keeps the TS/Vite configuration consistent with its ESM imports.

Harness configuration follows [Next's Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest),
the [Storybook Next.js Vite guide](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)
and [Playwright web-server guidance](https://playwright.dev/docs/test-webserver).
