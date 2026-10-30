const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// This reader never opens Balance's data directory or writes back to Balance.
function fresh(status, now) {
    return status?.version === 1 && status.enabled && Number.isFinite(status.refreshAt) && status.refreshAt > now;
}
function countdownFromStatus(status, now = Date.now()) {
    if (!fresh(status, now) || status.aiBlocked ||
        !Number.isFinite(status.countdownUntil) || status.countdownUntil <= now) return null;
    return status.countdownUntil;
}
// Minutes left in Touch grass's heads-up, or null outside one.
function headsUpFromStatus(status, now = Date.now()) {
    if (!fresh(status, now)) return undefined;
    const soon = status.modes?.find?.(mode => mode?.id === 'touch-grass')?.soon;
    return Number.isFinite(soon) ? soon : null;
}
class SituateReader {
    constructor(file = path.join(os.homedir(), '.local/share/balance-situate/status.json')) {
        this.file = file;
        this.until = null;
        this.soon = undefined;
        this.timer = null;
    }
    read() { return countdownFromStatus(this.readStatus()); }
    readStatus() {
        let descriptor;
        try {
            descriptor = fs.openSync(this.file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
            const metadata = fs.fstatSync(descriptor);
            if (!metadata.isFile() || metadata.size > 512000 ||
                (process.getuid && (metadata.uid !== process.getuid() || (metadata.mode & 0o077)))) return null;
            return JSON.parse(fs.readFileSync(descriptor, 'utf8'));
        } catch { return null; }
        finally { if (descriptor !== undefined) fs.closeSync(descriptor); }
    }
    poll(onChange, onFiveMinuteWarning, now = Date.now()) {
        const status = this.readStatus();
        const until = countdownFromStatus(status, now); const changed = until !== this.until; this.until = until; if (changed || until) onChange(until);
        // Only a heads-up seen arriving starts a timer, so relaunching Cactus mid-warning never restarts one.
        const soon = headsUpFromStatus(status, now);
        if (soon === undefined) return;
        if (soon === 5 && this.soon !== undefined && this.soon !== 5) onFiveMinuteWarning?.();
        this.soon = soon;
    }
    start(onChange, onFiveMinuteWarning) {
        const tick = () => this.poll(onChange, onFiveMinuteWarning);
        tick(); this.timer = setInterval(tick, 1000); this.timer.unref();
    }
    stop() { clearInterval(this.timer); }
}
module.exports = { SituateReader, countdownFromStatus, headsUpFromStatus };
