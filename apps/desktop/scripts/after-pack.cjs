// electron-builder afterPack hook: make the packaged tree complete, then prove
// the host can start from it.
//
// Why: electron-builder 26's pnpm collector reads `dedupedDependenciesCount`
// from `pnpm list --json` as "this entry is a duplicate reference" and skips it.
// On pnpm 11 with this dependency graph every occurrence of a shared package can
// be marked that way, so the collector never records a path for it and silently
// leaves it out of resources/app/node_modules. v0.2.8 shipped 57 packages short —
// including @deepseek-ai/dsh-app-boot, which the host imports before anything
// else — so every platform refused to start.
//
// What this does: ask pnpm for the production dependency names, resolve each
// with Node from the app's own node_modules (the same resolution the host uses
// at runtime), copy whatever the packager missed, then run the packaged host's
// `--version`. A package that cannot be restored, or a host that cannot start,
// fails the build here instead of at a user's desk.

"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");
const { execFileSync } = require("node:child_process");

/** Every dependency name in `pnpm list --json` output (pnpm 11: an array). */
function listProductionNames(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  const names = new Set();
  const visit = (deps) => {
    if (!deps) return;
    for (const [name, value] of Object.entries(deps)) {
      names.add(name);
      visit(value?.dependencies);
      visit(value?.optionalDependencies);
    }
  };
  for (const entry of Array.isArray(parsed) ? parsed : [parsed]) {
    visit(entry?.dependencies);
    visit(entry?.optionalDependencies);
  }
  return names;
}

function productionNames(projectDir) {
  const out = execFileSync(
    "pnpm",
    ["list", "--prod", "--json", "--depth", "Infinity", "--silent", "--loglevel=error"],
    { cwd: projectDir, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }
  );
  return listProductionNames(out);
}

/**
 * Copy production packages that Node can resolve from `projectDir` but that are
 * missing from `packagedModules`.
 *
 * A name that does not resolve at all is a platform-specific optional
 * dependency (pnpm never installed it here); there is nothing to copy and
 * nothing the runtime could load.
 */
function syncPackages({ projectDir, packagedModules, names }) {
  const req = createRequire(path.join(projectDir, "package.json"));
  const copied = [];
  const unresolved = [];
  for (const name of names) {
    const target = path.join(packagedModules, name);
    if (fs.existsSync(path.join(target, "package.json"))) continue;
    let source;
    try {
      source = path.dirname(req.resolve(`${name}/package.json`));
    } catch {
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, { recursive: true, dereference: true });
    copied.push(name);
    if (!fs.existsSync(path.join(target, "package.json"))) {
      unresolved.push(name);
    }
  }
  return { copied, unresolved };
}

/** Run the packaged host once. Its imports are the cheapest real completeness check. */
function hostBoots({ resourcesDir, appDir }) {
  const bundled =
    process.platform === "win32"
      ? path.join(resourcesDir, "node", "node.exe")
      : path.join(resourcesDir, "node", "bin", "node");
  const node = fs.existsSync(bundled) ? bundled : process.execPath;
  const binJs = path.join(appDir, "node_modules", "@deepseek-ai", "dsh", "lib", "bin.js");
  if (!fs.existsSync(binJs)) {
    throw new Error(`after-pack: ${binJs} is missing from the packaged tree`);
  }
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "neo-dsh-gate-"));
  try {
    const version = execFileSync(node, [binJs, "--version"], {
      cwd: appDir,
      encoding: "utf8",
      env: { ...process.env, DSH_HOME: home },
    }).trim();
    if (!/^\d+\.\d+\.\d+/.test(version)) {
      throw new Error(`after-pack: unexpected --version output: ${version.slice(0, 200)}`);
    }
    return version;
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
}

async function afterPack(context) {
  const projectDir = context.packager.projectDir;
  // macOS keeps them under Contents/Resources, Windows/Linux under resources/.
  const resourcesDir = context.packager.getResourcesDir(context.appOutDir);
  const appDir = path.join(resourcesDir, "app");
  if (!fs.existsSync(path.join(appDir, "package.json"))) {
    throw new Error(`after-pack: ${appDir} has no package.json; nothing to verify`);
  }

  const { copied, unresolved } = syncPackages({
    projectDir,
    packagedModules: path.join(appDir, "node_modules"),
    names: productionNames(projectDir),
  });
  if (unresolved.length > 0) {
    throw new Error(`after-pack: copied but still incomplete: ${unresolved.join(", ")}`);
  }
  if (copied.length > 0) {
    console.log(
      `  • after-pack: restored ${copied.length} package(s) the collector skipped: ${copied.join(", ")}`
    );
  }
  console.log(`  • after-pack: packaged host starts (dsh ${hostBoots({ resourcesDir, appDir })})`);
}

module.exports = afterPack;
module.exports.listProductionNames = listProductionNames;
module.exports.syncPackages = syncPackages;
module.exports.hostBoots = hostBoots;
