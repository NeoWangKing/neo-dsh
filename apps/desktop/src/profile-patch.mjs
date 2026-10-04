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
 * allows) does not have to parse here.
 *
 * @param text - contents of a `cordis.patch.yml`.
 * @returns the declared ids, without repeats.
 */
export function patchEntryIds(text) {
  const found = String(text ?? '').matchAll(/^[ \t]*-[ \t]*id:[ \t]*([^\s#'"]+)/gm)
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
