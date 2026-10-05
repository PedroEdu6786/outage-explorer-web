import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { checkBoundaries, filesBelow } from "./check-boundaries.mjs";

export async function checkArtifacts(root = process.cwd()) {
  const errors = [];
  const output = resolve(root, ".next");
  let manifest;
  try {
    await stat(resolve(output, "BUILD_ID"));
    manifest = JSON.parse(await readFile(resolve(output, "build-manifest.json"), "utf8"));
  } catch { return { errors: ["Complete production build absent; run npm run build first."], scanned: 0 }; }
  const sentinelSource = ts.createSourceFile("sentinels.ts", await readFile(resolve(root, "tests/fixtures/sentinels.ts"), "utf8"), ts.ScriptTarget.Latest, true);
  const markers = [];
  const visit = (node) => {
    if (ts.isStringLiteralLike(node)) markers.push(node.text);
    ts.forEachChild(node, visit);
  };
  visit(sentinelSource);
  if (!markers.length) errors.push("Fixture sentinel definitions are empty; cannot establish artifact exclusion.");
  const emitted = (await filesBelow(output)).filter((file) => /\.(?:js|mjs|cjs|json|html|css|map|txt|rsc)$/.test(file) && !file.includes("/cache/") && !file.includes("/diagnostics/"));
  if (!emitted.some((file) => file.includes("/static/") && file.endsWith(".js")) || !emitted.some((file) => file.includes("/server/") && file.endsWith(".js"))) errors.push("Production client/server JavaScript output is empty.");
  const manifestFiles = [...(manifest.polyfillFiles ?? []), ...Object.values(manifest.pages ?? {}).flat()];
  for (const name of manifestFiles) {
    try { await stat(resolve(output, name)); } catch { errors.push(`Build manifest asset is missing: ${name}`); }
  }
  for (const file of emitted) {
    const body = await readFile(file, "utf8");
    for (const marker of markers) if (body.includes(marker)) errors.push(`Fixture signature ${JSON.stringify(marker)} emitted in ${file.slice(root.length + 1)}`);
  }
  return { errors, scanned: emitted.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = await checkBoundaries(process.cwd(), { requireLive: process.argv.includes("--require-live") });
  const artifacts = await checkArtifacts();
  const errors = [...source.errors, ...artifacts.errors];
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log(`Production fixture exclusion passed: transitive source graph and ${artifacts.scanned} emitted files. Bootstrap evidence only unless --require-live is set.`);
}
