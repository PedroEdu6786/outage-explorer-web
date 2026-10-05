import { readFile, readdir, realpath, stat } from "node:fs/promises";
import { builtinModules, createRequire } from "node:module";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const code = /\.(?:[cm]?[jt]sx?)$/;
const isolated = /(?:^|\/)(?:tests?|fixtures?|demos?|__tests__|\.storybook)(?:\/|$)|\.(?:stories|test|spec)\.[cm]?[jt]sx?$/;
const forbiddenPackage = /^(?:@aws-sdk\/|aws-sdk(?:\/|$)|duckdb(?:\/|$)|@duckdb\/|pg(?:\/|$)|postgres(?:\/|$)|mysql|better-sqlite3|sqlite|@eia\/)/i;
const forbiddenAddress = /(?:https?:\/\/[^\s]*\beia\.gov\b|s3:\/\/|postgres(?:ql)?:\/\/|[\w.-]+\.rds\.amazonaws\.com)/i;

export async function filesBelow(path) {
  let entries;
  try { entries = await readdir(path, { withFileTypes: true }); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
  const result = [];
  for (const entry of entries) {
    const child = resolve(path, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not accepted in checked source/output: ${child}`);
    if (entry.isDirectory()) result.push(...await filesBelow(child));
    else result.push(child);
  }
  return result;
}

function layerViolation(from, to) {
  const feature = (path) => /^src\/features\/([^/]+)\//.exec(path)?.[1];
  const sourceFeature = feature(from);
  const targetFeature = feature(to);
  if (targetFeature && sourceFeature !== targetFeature && !/^src\/features\/[^/]+\/index\.tsx?$/.test(to)) {
    return "feature internals require the feature's public index.ts entry";
  }
  const atom = from.startsWith("src/components/atoms/");
  const molecule = from.startsWith("src/components/molecules/");
  const shared = from.startsWith("src/components/");
  if (shared && /^src\/(?:features|app|session|adapters|integration|composition|lib\/api|lib\/auth|production)\//.test(to)) return "shared UI cannot import product/session/transport modules";
  if ((atom || molecule) && to.startsWith("src/contracts/")) return "atoms/molecules cannot import product contracts";
  if (atom && /^src\/components\/(?:molecules|organisms|templates)\//.test(to)) return "atoms cannot depend on higher UI layers";
  if (molecule && /^src\/components\/(?:organisms|templates)\//.test(to)) return "molecules cannot depend on higher UI layers";
  if (/^src\/features\//.test(from) && /^src\/(?:app|production|adapters|integration|composition|lib\/api)\//.test(to)) return "features consume injected operations rather than routes/HTTP adapters";
  if (/^src\/contracts\//.test(from) && !/^src\/contracts\//.test(to)) return "contracts must remain independent of implementation modules";
  if (/^src\/session\//.test(from) && /^src\/(?:app|features|production|adapters|integration|composition|lib\/api)\//.test(to)) return "shared session runtime cannot import feature/composition/HTTP modules";
  return undefined;
}

export async function checkBoundaries(root = process.cwd(), { requireLive = false } = {}) {
  root = await realpath(root);
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const allowedPackages = new Set(Object.keys(packageJson.dependencies ?? {}));
  const require = createRequire(resolve(root, "package.json"));
  const builtins = new Set(builtinModules.map((name) => name.replace(/^node:/, "")));
  const configPath = ts.findConfigFile(root, ts.sys.fileExists);
  const config = configPath ? ts.readConfigFile(configPath, ts.sys.readFile).config : {};
  const compilerOptions = ts.parseJsonConfigFileContent(config, ts.sys, root).options;
  const paths = (await filesBelow(resolve(root, "src"))).filter((file) => code.test(file) && !isolated.test(relative(root, file)));
  const roots = paths.filter((file) => /src\/(?:app|composition|integration)\//.test(relative(root, file)));
  const errors = [];
  const seen = new Set();
  const display = (file) => relative(root, file).replaceAll("\\", "/");
  if (!roots.length) errors.push("No production roots found; cannot establish source reachability.");
  if (requireLive) {
    const registration = paths.find((file) => display(file) === "src/composition/production-operations.ts");
    if (!registration) errors.push("Live production entry src/composition/production-operations.ts is absent; release gate fails closed.");
    else {
      const source = ts.createSourceFile(registration, await readFile(registration, "utf8"), ts.ScriptTarget.Latest, true);
      let ready = false;
      for (const statement of source.statements) {
        if (!ts.isVariableStatement(statement) || !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
        for (const declaration of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "productionRegistration") continue;
          let initializer = declaration.initializer;
          if (initializer && ts.isAsExpression(initializer)) initializer = initializer.expression;
          ready = Boolean(initializer && ts.isObjectLiteralExpression(initializer) && initializer.properties.some((property) => ts.isPropertyAssignment(property) && property.name.getText(source) === "status" && ts.isStringLiteral(property.initializer) && property.initializer.text === "ready"));
        }
      }
      if (!ready) errors.push("Live production registration is unavailable or unverified; T6.L release gate fails closed.");
    }
  }

  async function inspect(file, production) {
    const key = `${file}:${production}`;
    if (seen.has(key)) return;
    seen.add(key);
    const source = ts.createSourceFile(file, await readFile(file, "utf8"), ts.ScriptTarget.Latest, true);
    const requests = [];
    const fail = (message) => errors.push(`${display(file)}: ${message}`);
    for (const diagnostic of source.parseDiagnostics) fail(`source parse error: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
    function visit(node) {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier) requests.push(node.moduleSpecifier);
      }
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) requests.push(node.argument.literal);
      if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression) requests.push(node.moduleReference.expression);
      if (ts.isIdentifier(node) && node.text === "require" && !(ts.isCallExpression(node.parent) && node.parent.expression === node)) fail("require aliases and references outside literal calls are forbidden");
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const expression = node.expression;
        if ((ts.isPropertyAccessExpression(expression) && ["eval", "Function"].includes(expression.name.text)) ||
          (ts.isElementAccessExpression(expression) && expression.argumentExpression && ts.isStringLiteralLike(expression.argumentExpression) && ["eval", "Function"].includes(expression.argumentExpression.text))) fail("indirect runtime code evaluation is forbidden");
      }
      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        if (expr.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(expr) && expr.text === "require")) {
          if (node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) requests.push(node.arguments[0]);
          else fail("non-literal dynamic module loading is forbidden");
        }
        if (ts.isIdentifier(expr) && ["eval", "Function"].includes(expr.text)) fail("runtime code evaluation is forbidden");
        if (ts.isPropertyAccessExpression(expr) && expr.getText(source) === "require.resolve") fail("require.resolve indirection is forbidden");
      }
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Function") fail("runtime code evaluation is forbidden");
      if (ts.isStringLiteralLike(node) && forbiddenAddress.test(node.text)) fail("direct EIA/storage/database address is forbidden");
      ts.forEachChild(node, visit);
    }
    visit(source);
    for (const node of requests) {
      if (!ts.isStringLiteralLike(node)) { fail("non-literal module specifier"); continue; }
      const name = node.text;
      if (forbiddenPackage.test(name)) { fail(`direct source/storage package is forbidden: ${name}`); continue; }
      const resolved = ts.resolveModuleName(name, file, compilerOptions, ts.sys).resolvedModule?.resolvedFileName;
      if (name.startsWith(".") || name.startsWith("@/") || isAbsolute(name) || (resolved && !resolved.includes("/node_modules/"))) {
        let target = resolved;
        if (!target && /\.(?:css|svg|png|jpg|woff2?)$/.test(name)) {
          const asset = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : resolve(dirname(file), name);
          try { if ((await stat(asset)).isFile()) target = asset; } catch { /* unresolved assets fail below */ }
        }
        if (!target) { fail(`unresolved local import: ${name}`); continue; }
        target = await realpath(target);
        const targetName = display(target);
        if (targetName.startsWith("../")) { fail(`import escapes repository: ${name}`); continue; }
        if (isolated.test(targetName)) { fail(`production source reaches test/fixture/demo module: ${targetName}`); continue; }
        const violation = layerViolation(display(file), targetName);
        if (violation) fail(`${violation}: ${targetName}`);
        if (code.test(target)) await inspect(target, production);
      } else {
        const base = name.startsWith("@") ? name.split("/").slice(0, 2).join("/") : name.split("/")[0];
        if (display(file).startsWith("src/contracts/")) { fail(`contracts cannot import runtime/framework dependencies: ${name}`); continue; }
        if (builtins.has(name.replace(/^node:/, ""))) {
          if (/^(?:node:)?module(?:\/|$)/.test(name)) fail(`indirect module-loader access is forbidden: ${name}`);
          if (production && /^(?:node:)?(?:fs|child_process|sqlite)(?:\/|$)/.test(name)) fail(`direct filesystem/process/database access is forbidden: ${name}`);
          continue;
        }
        if (!allowedPackages.has(base)) { fail(`external module is not an approved production dependency: ${name}`); continue; }
        try { require.resolve(name); } catch { if (!resolved) fail(`unresolved external import: ${name}`); }
      }
    }
  }
  for (const rootFile of roots) await inspect(rootFile, true);
  // Unreferenced source modules still obey ownership/layer rules; isolated
  // stories and tests remain permitted composition roots outside this traversal.
  for (const sourceFile of paths) await inspect(sourceFile, false);
  return { errors: [...new Set(errors)], roots: roots.map(display), checked: paths.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkBoundaries(process.cwd(), { requireLive: process.argv.includes("--require-live") });
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else console.log(`Source boundaries passed: ${result.checked} modules, ${result.roots.length} production roots. Live registration ${process.argv.includes("--require-live") ? "required" : "not yet required"}.`);
}
