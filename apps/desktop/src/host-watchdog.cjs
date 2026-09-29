/**
 * Loaded into the harness host with `node --require`, before the host itself runs.
 *
 * The host is this window's child: when the window quits, the shell stops it. But a
 * shell that is SIGKILLed, crashes, or is torn down together with its whole session
 * gets no chance to do that, and the host would then keep the port for the rest of the
 * boot — the next launch finds the port taken and fails with "the host exited before
 * it was ready".
 *
 * Nothing inside the dying process can fix that, so the check lives in the child. The
 * shell passes its own pid in `DSH_HOST_PARENT_PID`, and the host stops when that
 * process is gone. Comparing against a pid passed in, rather than against the parent
 * this process happens to have at load time, also covers the case where the shell dies
 * *while* the host is still starting up: by then the host has already been reparented,
 * but the pid it was told about is still the one that matters.
 *
 * SIGTERM first, so the host can close its session stores, then a hard exit if it has
 * not gone by itself. `DSH_HOST_WATCHDOG_MS` overrides the poll interval; tests use it
 * to stay fast.
 */

const DEFAULT_INTERVAL_MS = 2000

const configured = Number(process.env.DSH_HOST_WATCHDOG_MS ?? DEFAULT_INTERVAL_MS)
const interval = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_INTERVAL_MS

const declaredParent = Number(process.env.DSH_HOST_PARENT_PID ?? '')
/** The parent the shell told us about; falls back to whoever we have now. */
const parent = Number.isInteger(declaredParent) && declaredParent > 0 ? declaredParent : process.ppid

/** Whether the shell this host belongs to is still there. */
function shellIsGone() {
  // Reparented: the parent we were told about cannot be ours any more.
  if (process.ppid !== parent) return true
  try {
    process.kill(parent, 0)
    return false
  } catch (error) {
    // ESRCH means no such process. Anything else (EPERM, for instance) means it is
    // there and we simply may not signal it, which is not our business.
    return error?.code === 'ESRCH'
  }
}

const timer = setInterval(() => {
  if (!shellIsGone()) return
  clearInterval(timer)
  try {
    process.kill(process.pid, 'SIGTERM')
  } catch {
    // If the signal cannot be delivered, the hard exit below is the fallback.
  }
  setTimeout(() => process.exit(0), 3000).unref()
}, interval)

// Never hold the host open on the guard's account.
timer.unref()
