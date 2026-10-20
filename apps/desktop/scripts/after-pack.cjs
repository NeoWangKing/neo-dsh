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
// What this does: ask pnpm for the production dependency list (walking the
// installed tree if pnpm is unavailable), copy every package the packager
// missed, then run the packaged host's `--version`. A package that cannot be
// restored, or a host that cannot start, fails the build here instead of at a
// user's desk.

"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");
const { execFileSync } = require("node:child_process");

/** Every dependency name in `pnpm list --json` output (pnpm 11: an array). */
function listNames(json) {
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

/**
 * The directory of an installed package, without going through `require.resolve`:
 * packages with an `exports` map that does not expose `./package.json` (koffi,
 * @vscode/ripgrep) throw `ERR_PACKAGE_PATH_NOT_EXPORTED` from the normal resolver
 * even though the directory is right there.
 */
function locatePackage(fromDir, name) {
  const req = createRequire(path.join(fromDir, "package.json"));
  for (const base of req.resolve.paths(name) ?? []) {
    const dir = path.join(base, name);
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
  }
  return null;
}

/** Walk the installed production tree. Used when pnpm cannot be spawned. */
function walkNames(projectDir) {
  const names = new Set();
  const seen = new Set();
  const visit = (dir) => {
    const real = path.resolve(dir);
    if (seen.has(real)) return;
    seen.add(real);
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(path.join(real, "package.json"), "utf8"));
    } catch {
      return;
    }
    for (const name of Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.optionalDependencies ?? {}) })) {
      names.add(name);
      const child = locatePackage(real, name);
      if (child) visit(child);
    }
  };
  visit(projectDir);
  return names;
}

function productionNames(projectDir) {
  const args = ["list", "--prod", "--json", "--depth", "Infinity", "--silent", "--loglevel=error"];
  const options = { cwd: projectDir, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 };
  try {
    // `pnpm` is a `.cmd` shim on Windows; execFileSync cannot spawn it directly
    // (v0.2.9's first Windows build died on `spawnSync pnpm ENOENT`).
    const out =
      process.platform === "win32"
        ? execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "pnpm", ...args], options)
        : execFileSync("pnpm", args, options);
    return listNames(out);
  } catch (error) {
    console.warn(`  • after-pack: pnpm list failed (${error.code || error.message.split("\n")[0]}); walking node_modules`);
    return walkNames(projectDir);
  }
}

/**
 * Copy production packages that are installed but missing from the packaged
 * tree. A name that is not installed here is a platform-specific optional
 * dependency; there is nothing to copy and nothing the runtime could load.
 */
function syncPackages({ projectDir, packagedModules, names }) {
  const copied = [];
  const unresolved = [];
  for (const name of names) {
    const target = path.join(packagedModules, name);
    if (fs.existsSync(path.join(target, "package.json"))) continue;
    const source = locatePackage(projectDir, name);
    if (!source) continue;
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
module.exports.listNames = listNames;
module.exports.walkNames = walkNames;
module.exports.locatePackage = locatePackage;
module.exports.syncPackages = syncPackages;
module.exports.hostBoots = hostBoots;
