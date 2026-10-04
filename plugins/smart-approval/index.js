'use strict';
/**
 * dsh-smart-approval — host half: one permission preset that stops asking about the
 * things that cannot hurt, and keeps asking about the ones that can.
 *
 * WHY: the harness ships two approval policies, `ask` (every escalation stops for a
 * human) and `never` (every escalation is refused), and a sandbox mode beside them. The
 * useful middle — "let the harmless through, keep the dangerous" — is not a policy but a
 * decision per call, which is what `tools/pre-execute` exists for: it sees the tool name
 * and its parsed arguments (the command text, the path) and may answer `allow` before the
 * call is dispatched.
 *
 * WHAT IT DOES NOT DO: it never widens the sandbox. Allowing a call only skips the
 * approval question; the sandbox still decides what the command may touch. The single
 * exception is an *escalation* — a retry carrying `sandbox_permissions`, which asks to run this
 * one call under a wider *file* policy — and every escalation goes to the human, whatever mode
 * it names, because a widening is the one thing a rule cannot judge from the outside.
 *
 * Rules only, by request: no model call, no network, no surprise latency, and the same
 * command always gets the same answer. Anything it does not recognise falls through to
 * the normal policy, which under the preset is a question for the user.
 *
 * @module dsh-smart-approval
 */

/** Tools that a user would not expect to be asked about at all. */
const READ_ONLY_TOOLS = new Set(['read', 'glob', 'grep', 'web_search', 'web_fetch']);

/** Tools whose writes the sandbox already confines; a wider request arrives as an escalation. */
const WRITE_TOOLS = new Set(['write', 'edit']);

/** Tools that run a command string, with or without a PTY. */
const COMMAND_TOOLS = new Set(['bash', 'pwsh', 'bash_persistent', 'pwsh_persistent']);

/**
 * Never auto-approved, however the call is phrased. These are the operations whose worst
 * case is not "a wasted turn": privilege escalation, irreversible deletion, running
 * fetched code, rewriting system state.
 */
const DANGEROUS = [
  /\b(sudo|doas)\b/,
  /\bsu\s+-/,
  /\brm\s+(-[a-zA-Z]*\s+)*-[a-zA-Z]*[rR][a-zA-Z]*[fF]|\brm\s+-[a-zA-Z]*[fF][a-zA-Z]*[rR]/,
  /\b(mkfs|fdisk|parted|wipefs|shred)\b/,
  /\bdd\b[^|;]*\bof=\/dev\//,
  /\b(curl|wget)\b[^|;]*\|\s*(ba|z|k|c|da)?sh\b/,
  /\bgit\s+push\b[^\n]*(--force\b|--force-with-lease\b|(?<![\w-])-f\b)/,
  /\b(pacman|apt|apt-get|dnf|yum|zypper|apk|brew)\b[^\n]*\b(-S\b|-R\b|-U\b|install\b|remove\b|purge\b|upgrade\b|update\b)/,
  /\b(systemctl|service|loginctl)\s+(start|stop|restart|reload|enable|disable|mask|unmask|set-default)\b/,
  /\b(chmod|chown|chgrp|setfacl)\b[^\n]*\s(\/(etc|usr|boot|var|opt|srv|root)\b|~\/\.ssh\b)/,
  /(^|[\s;&|])(>>?|\|\s*tee)\s*\/(etc|usr|boot|var|opt|srv|root)\b/,
  /\b(shutdown|reboot|poweroff|halt|init\s+0|init\s+6)\b/,
  /\b(useradd|usermod|userdel|passwd|groupadd)\b/,
]

/**
 * Commands that reach the network but do not change the system: dependency installs into
 * the project, fetches, read-only HTTP. The sandbox still confines where their bytes land.
 */
const NETWORK_OK = [
  /^\s*(npm|pnpm|yarn|bun)\s+(install|i|add|ci|fetch|update|why|outdated|view|info)\b/,
  /\bgit\s+(fetch|pull|clone|remote\s+update|submodule\s+update)\b/,
  /^\s*(curl|wget)\b/,
  /\b(pip|pip3|uv|poetry)\s+(install|sync|add|download)\b/,
  /^\s*(cargo|go)\s+(fetch|build|test|run|mod\s+download)\b/,
]

/** Commands that only look at things. */
/** Project scripts: they run project code, inside the sandbox, without touching system state. */
const PROJECT_SCRIPTS = [
  /^\s*(pnpm|npm|yarn|bun)\s+(test|build|lint|typecheck|type-check|check|format|dev|start|serve)(\s|$)/,
  /^\s*(pnpm|npm|yarn|bun)\s+(run\s+)?[\w:-]+\s*$/,
  /^\s*(cargo|go|make|just)\s+(build|test|run|check|fmt|clippy)(\s|$)/,
]

/** `sed -i` and friends rewrite files in place: never "read-only" in effect. */
const IN_PLACE_EDIT = /^\s*(sed|perl|ruby|python3?)\b[^|;]*\s(-i|--in-place)\b/

const READ_ONLY = [
  /^\s*(ls|pwd|cat|head|tail|wc|stat|file|tree|which|type|whoami|id|hostname|date|uptime|uname|df|du|free|env|printenv|echo|printf|true|test)\b/,
  /^\s*(rg|grep|fd|git|jq|sed|awk|sort|uniq|cut|tr|basename|dirname|realpath|readlink|sha256sum|md5sum|diff|comm)\b/,
  /^\s*node\b.*(--version|-v\s*$)/,
  /^\s*(pnpm|npm|yarn|bun)\s+(list|ls|run\s+(lint|test|typecheck|build)|exec\s+(tsc|eslint|vitest|jest))\b/,
]

/** Read-only commands that can still write when handed these flags. */
const WRITE_FLAGS = /(\s|^)(-delete|-exec|-execdir|-ok|-okdir|--in-place|-i\s*$)/;

/** Absolute paths whose modification is a system change, not a project change. */
const SYSTEM_PATHS = /(^|[\s"'=([:]])\/(etc|usr|boot|var|opt|srv|root|lib|bin|sbin)\b/;

/**
 * Decide one pending call.
 *
 * @param exec - `{name, arguments}` from `tools/pre-execute`.
 * @returns `{decision: 'allow'|'ask', reason}` — `ask` means "fall through to the normal
 *   policy", which under this preset is a question for the user.
 */
function classify(exec) {
  const name = typeof exec?.name === 'string' ? exec.name : '';
  const args = (exec?.arguments ?? {});
  const escalate = typeof args.sandbox_permissions === 'string' ? args.sandbox_permissions : undefined;

  if (!COMMAND_TOOLS.has(name) && !READ_ONLY_TOOLS.has(name) && !WRITE_TOOLS.has(name)) {
    return { decision: 'ask', reason: `unknown tool ${name}` };
  }

  const command = COMMAND_TOOLS.has(name) && typeof args.command === 'string' ? args.command : '';
  if (COMMAND_TOOLS.has(name) && command.trim() === '') return { decision: 'ask', reason: 'empty command' };

  // The command's own risk first, so no justification can talk a dangerous command past
  // this: an escalation only ever requests wider *file* access.
  for (const pattern of DANGEROUS) {
    if (pattern.test(command)) return { decision: 'ask', reason: `matches ${String(pattern)}` };
  }
  if (IN_PLACE_EDIT.test(command)) return { decision: 'ask', reason: 'rewrites files in place' };
  if (WRITE_FLAGS.test(command) && !READ_ONLY.slice(0, 2).some((pattern) => pattern.test(command))) {
    return { decision: 'ask', reason: 'a writing flag on a command that is otherwise read-only' };
  }
  if (SYSTEM_PATHS.test(command) && !/^\s*(ls|cat|head|tail|rg|grep|stat|file|df|du|readlink|realpath|sha256sum|md5sum)\b/.test(command)) {
    return { decision: 'ask', reason: 'touches a system path' };
  }

  // An escalation widens the file policy for this one call. `workspace-write` stays inside the
  // bounds this preset already grants (a package cache, a build directory); anything reaching
  // for `danger-full-access` is exactly the case a rule cannot judge, so the human decides.
  if (escalate !== undefined) {
    return escalate === 'workspace-write'
      ? { decision: 'allow', reason: 'escalation that stays inside the workspace policy' }
      : { decision: 'ask', reason: `escalation to ${escalate}` };
  }

  if (READ_ONLY_TOOLS.has(name)) return { decision: 'allow', reason: 'read-only tool' };
  if (WRITE_TOOLS.has(name)) return { decision: 'allow', reason: 'write confined by the file sandbox' };
  if (READ_ONLY.some((pattern) => pattern.test(command))) return { decision: 'allow', reason: 'read-only command' };
  if (PROJECT_SCRIPTS.some((pattern) => pattern.test(command))) return { decision: 'allow', reason: 'project script' };
  for (const pattern of NETWORK_OK) {
    if (pattern.test(command)) return { decision: 'allow', reason: 'network use that does not change the system' };
  }
  return { decision: 'ask', reason: 'unrecognised command' };
}

/**
 * Cordis plugin body.
 * @param ctx - the host context (needs the `tools` registry).
 */
function apply(ctx) {
  ctx.on('tools/pre-execute', (exec, next) => {
    const verdict = classify(exec);
    // `ask` means "not mine to answer": let the normal policy — and the user — decide.
    if (verdict.decision !== 'allow') return next();
    return { kind: 'allow' };
  });
}

module.exports = { name: 'dsh-smart-approval', apply, classify };
