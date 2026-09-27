'use strict';
/**
 * dsh-activity-line — installed (bundle) HOST half.
 *
 * The readout is pure client-side: the browser half (exports["./client"] →
 * client.js) reads the session's own view snapshot and projections and renders one
 * line under the composer. Nothing runs in the host realm, so this entry is
 * intentionally a no-op — it exists because the loader mounts one cordis row per
 * bundle and needs a resolvable main entry.
 *
 * Install:
 *   dsh plugin --profile web add link:/path/to/dsh-activity-line
 */
const NAME = 'dsh-activity-line';

function apply() {
  // Pure client-side plugin — nothing to do in the host realm.
}

module.exports = {
  name: NAME,
  apply
};
