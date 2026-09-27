'use strict';
/**
 * dsh-desktop-settings — installed (bundle) HOST half.
 *
 * The settings surface is pure client-side: the browser half (exports["./client"] →
 * client.js) renders one row in Settings → General and asks the desktop shell (over
 * the /__dsh_desktop_update path) to check for, download and install updates.
 * Nothing runs in the host realm, so this entry is intentionally a no-op — it exists
 * because the loader mounts one cordis row per bundle and needs a main entry.
 *
 * Install:
 *   dsh plugin --profile web add link:/path/to/dsh-desktop-settings
 */
const NAME = 'dsh-desktop-settings';

function apply() {
  // Pure client-side plugin — nothing to do in the host realm.
}

module.exports = {
  name: NAME,
  apply
};
