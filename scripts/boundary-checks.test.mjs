import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { checkBoundaries } from "./check-boundaries.mjs";
import { checkArtifacts } from "./check-production-fixtures.mjs";

async function tree(t, additions = {}) {
  const root = await mkdtemp(join(tmpdir(), "outage-boundary-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const files = {
    "package.json": JSON.stringify({ dependencies: {} }),
    "tsconfig.json": JSON.stringify({ compilerOptions: { moduleResolution: "bundler", paths: { "@/*": ["./src/*"] } } }),
    "src/app/layout.ts": "export const layout = true;",
    ...additions,
  };
  for (const [name, body] of Object.entries(files)) {
    const path = join(root, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }
  return root;
}

test("isolated stories/tests may import fixtures without becoming production roots", async (t) => {
  const root = await tree(t, {
    "src/features/auth/index.ts": "export const entry = true;",
    "src/features/auth/Auth.stories.ts": "import '../../../tests/fixtures/operations';",
    "src/features/auth/Auth.test.ts": "import './private-controller';",
  });
  assert.deepEqual((await checkBoundaries(root)).errors, []);
});

for (const [name, additions, expected] of [
  ["alias/transitive reexport", {
    "src/app/layout.ts": "import '@/shared/barrel';",
    "src/shared/barrel.ts": "export * from '../../tests/fixtures/operations';",
    "tests/fixtures/operations.ts": "export const fixture = true;",
  }, /fixture/],
  ["literal dynamic fixture import", {
    "src/app/layout.ts": "void import('../../tests/fixtures/operations');",
    "tests/fixtures/operations.ts": "export const fixture = true;",
  }, /fixture/],
  ["computed dynamic import", { "src/app/layout.ts": "const target = './secret'; void import(target);" }, /non-literal/],
  ["computed require", { "src/app/layout.ts": "const target = './secret'; require(target);" }, /non-literal/],
  ["createRequire loader escape", { "src/app/layout.ts": "import {createRequire} from 'node:module'; const load = createRequire(import.meta.url); load('../../tests/fixtures/operations');" }, /module-loader/],
  ["require alias escape", { "src/app/layout.ts": "const load = require; load('../../tests/fixtures/operations');" }, /require aliases/],
  ["import-equals fixture", {
    "src/app/layout.ts": "import fixture = require('../../tests/fixtures/operations');",
    "tests/fixtures/operations.ts": "export const fixture = true;",
  }, /fixture/],
  ["globalThis eval", { "src/app/layout.ts": "globalThis.eval('code');" }, /runtime code evaluation/],
  ["globalThis Function", { "src/app/layout.ts": "new globalThis.Function('code');" }, /runtime code evaluation/],
  ["unresolved alias", { "src/app/layout.ts": "import '@/missing';" }, /unresolved/],
  ["sibling private feature", {
    "src/features/queries/controller.ts": "import '../explorer/private';",
    "src/features/explorer/private.ts": "export const privateValue = true;",
  }, /public index/],
  ["atom imports product contract", {
    "src/components/atoms/Button.ts": "import '../../contracts/session';",
    "src/contracts/session.ts": "export type Session = string;",
  }, /product contracts/],
  ["feature imports HTTP adapter", {
    "src/features/queries/controller.ts": "import '../../lib/api/query';",
    "src/lib/api/query.ts": "export const query = true;",
  }, /injected operations/],
  ["direct AWS storage", { "src/app/layout.ts": "import '@aws-sdk/client-s3';" }, /source\/storage package/],
  ["direct EIA URL", { "src/app/layout.ts": "fetch('https://api.eia.gov/v2/nuclear');" }, /direct EIA/],
  ["direct server database", { "src/app/layout.ts": "import 'pg';" }, /source\/storage package/],
  ["direct filesystem", { "src/app/layout.ts": "import 'node:fs';" }, /filesystem/],
  ["undeclared external dependency", { "src/app/layout.ts": "import 'unknown-package';" }, /approved production dependency/],
]) {
  test(`rejects ${name}`, async (t) => {
    const result = await checkBoundaries(await tree(t, additions));
    assert.match(result.errors.join("\n"), expected);
  });
}

test("feature public entry is an allowed seam", async (t) => {
  const result = await checkBoundaries(await tree(t, {
    "src/features/queries/controller.ts": "import '../explorer';",
    "src/features/explorer/index.ts": "export { entry } from './private';",
    "src/features/explorer/private.ts": "export const entry = true;",
  }));
  assert.deepEqual(result.errors, []);
});

test("shared organism may consume a presentation table contract", async (t) => {
  const result = await checkBoundaries(await tree(t, {
    "src/components/organisms/DataTable.ts": "import type { Table } from '../../contracts/table';",
    "src/contracts/table.ts": "export type Table = string;",
  }));
  assert.deepEqual(result.errors, []);
});

test("contracts cannot import even an approved production framework package", async (t) => {
  const result = await checkBoundaries(await tree(t, {
    "package.json": JSON.stringify({ dependencies: { react: "19.3.0" } }),
    "src/contracts/session.ts": "import type { ReactNode } from 'react';",
  }));
  assert.match(result.errors.join("\n"), /contracts cannot import runtime\/framework dependencies/);
});

test("contracts cannot import Node builtin packages", async (t) => {
  const result = await checkBoundaries(await tree(t, { "src/contracts/session.ts": "import 'node:module';" }));
  assert.match(result.errors.join("\n"), /contracts cannot import runtime\/framework dependencies/);
});

for (const prefix of ["adapters/live", "integration", "composition"]) {
  test(`feature cannot import concrete ${prefix} module`, async (t) => {
    const result = await checkBoundaries(await tree(t, {
      "src/features/queries/controller.ts": `import '../../${prefix}/operation';`,
      [`src/${prefix}/operation.ts`]: "export const operation = true;",
    }));
    assert.match(result.errors.join("\n"), /injected operations/);
  });
}

test("live gate fails closed before production registration", async (t) => {
  const result = await checkBoundaries(await tree(t), { requireLive: true });
  assert.match(result.errors.join("\n"), /Live production entry/);
});

const buildFiles = {
  "tests/fixtures/sentinels.ts": 'export const markers = ["SYNTHETIC_ONLY_TEST"] as const;',
  ".next/BUILD_ID": "test-build",
  ".next/build-manifest.json": JSON.stringify({ pages: { "/404": ["static/smoke.js"] } }),
  ".next/static/smoke.js": "console.log('production');",
  ".next/server/smoke.js": "export const page = true;",
};

test("complete clean artifact output passes", async (t) => {
  const result = await checkArtifacts(await tree(t, buildFiles));
  assert.deepEqual(result.errors, []);
  assert.equal(result.scanned, 3);
});

test("nested emitted asset sentinel contamination fails", async (t) => {
  const result = await checkArtifacts(await tree(t, { ...buildFiles, ".next/server/nested/output.rsc": "SYNTHETIC_ONLY_TEST" }));
  assert.match(result.errors.join("\n"), /Fixture signature/);
});

test("missing build output fails rather than falsely passing an empty scan", async (t) => {
  const result = await checkArtifacts(await tree(t, { "tests/fixtures/sentinels.ts": buildFiles["tests/fixtures/sentinels.ts"] }));
  assert.match(result.errors.join("\n"), /Complete production build absent/);
});

test("missing manifest asset fails", async (t) => {
  const result = await checkArtifacts(await tree(t, {
    ...buildFiles,
    ".next/build-manifest.json": JSON.stringify({ pages: { "/404": ["static/missing.js"] } }),
  }));
  assert.match(result.errors.join("\n"), /manifest asset is missing/);
});

for (const status of ["unavailable", "ready"]) {
  test(`live registration ${status} is explicit rather than inferred from file existence`, async (t) => {
    const result = await checkBoundaries(await tree(t, {
      "src/composition/production-operations.ts": `export const productionRegistration = { status: "${status}" } as const;`,
    }), { requireLive: true });
    if (status === "ready") assert.deepEqual(result.errors, []);
    else assert.match(result.errors.join("\n"), /unavailable or unverified/);
  });
}
