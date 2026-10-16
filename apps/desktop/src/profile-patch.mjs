/**
 * Which of this app's shipped profile patches a live profile still needs.
 *
 * The shipped profile tree is a *seed*: `seedDirectory` copies it into a new home but never
 * overwrites a file that is already there, and a home that migrated from an older `~/.dsh`
 * arrives with its own profile files. So a home can be running an older patch layer than the
 * app ships — which is how the 智能批准 preset went missing in a home that had carried over a
 * pristine (empty) `cordis.patch.yml`.
 *
 * The app therefore offers its own layer to the host as an extra `--patch` overlay, but only
 * for entries the live file does not already name: an entry that is there was written either
 * by an earlier build or by the user, and an overlay would silently override the latter.
 *
 * @module profile-patch
 */

/**
 * The ids a patch file declares, in file order.
 *
 * The file is a YAML list of loader patch entries, each carrying the `id` it targets; only
 * that line is read, so the rest of the document (including `!!js` expressions this file
 * allows) does not have to parse here. Only **top-level** entries count — an entry is at
 * column zero, while the list-valued config inside one (a model catalog, say) indents its own
 * `- id:` lines, and those are not patch targets.
 *
 * @param text - contents of a `cordis.patch.yml`.
 * @returns the declared ids, without repeats.
 */
export function patchEntryIds(text) {
  const found = String(text ?? '').matchAll(/^- id:[ \t]*([^\s#'"]+)/gm)
  return [...new Set([...found].map((match) => match[1]))]
}

/**
 * The shipped ids a live profile patch file does not declare yet.
 *
 * @param shipped - contents of the patch file this app ships.
 * @param live - contents of the profile's own patch file, `''` when it has none.
 * @returns shipped ids missing from the live file; empty means nothing to overlay.
 */
export function missingPatchEntryIds(shipped, live) {
  const present = new Set(patchEntryIds(live))
  return patchEntryIds(shipped).filter((id) => !present.has(id))
}

/**
 * Which shipped bundles the live profile has to gain and lose, so an update carries its
 * plugins with it.
 *
 * The plugin manager materialises `dsh.profile.bundles` into the user's own profile, and a
 * patch can only ever *add* a row — so without this, a plugin we drop in a release would
 * keep loading in every existing home forever. `previous` is the list this app installed
 * last time (it records one), which is what makes the removal safe: we only take back what
 * we put there, never a bundle the user installed themselves.
 *
 * @param {string[]} current - the bundles this build ships.
 * @param {string[]} previous - the bundles this app installed into this home last time.
 * @param {string[]} existing - the live profile's current bundle list.
 * @returns {{remove: string[], add: string[]}} names to drop and names to mount.
 */
export function reconcileBundles(current, previous, existing) {
  const remove = previous.filter((name) => !current.includes(name) && existing.includes(name))
  const kept = existing.filter((name) => !remove.includes(name))
  const add = current.filter((name) => !kept.includes(name))
  return { remove, add }
}

/**
 * Which of the names we might withdraw are actually allowed to leave.
 *
 * `reconcileBundles` answers "what did we record that we no longer ship" — a statement about
 * bookkeeping, not about intent. Treating the two as one thing cost a user their whole community
 * plugin batch: this app ships most plugins as *dependencies* rather than as
 * `dsh.profile.bundles` entries, so to the reconcile they looked exactly like plugins it had
 * stopped shipping. It copied them in from the shipped `dependencies` and, in the same launch,
 * decided they were no longer ours and deleted them.
 *
 * Withdrawal is therefore explicit twice over: a name leaves only when this build does not ship
 * it *at all* (`shipped` is the union of what we bundle and what we depend on), and only when it
 * is on the `allowed` list — the plugins we have deliberately decided to stop shipping.
 *
 * @param {string[]} recorded - names the record says we put in this home before.
 * @param {string[]} shipped - every plugin name this build ships, bundled or depended on.
 * @param {string[]} allowed - names we have deliberately withdrawn.
 * @returns {string[]} the names that may be removed.
 */
export function withdrawable(recorded, shipped, allowed) {
  return recorded.filter((name) => !shipped.includes(name) && allowed.includes(name))
}
