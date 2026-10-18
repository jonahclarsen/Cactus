const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// This reader never opens Balance's data directory or writes back to Balance.
function countdownFromStatus(status, now = Date.now()) {
    if (status?.version !== 1 || !status.enabled || status.aiBlocked ||
        !Number.isFinite(status.refreshAt) || status.refreshAt <= now ||
        !Number.isFinite(status.countdownUntil) || status.countdownUntil <= now) return null;
    return status.countdownUntil;
}
class SituateReader {
    constructor(file = path.join(os.homedir(), '.local/share/balance-situate/status.json')) {
        this.file = file;
        this.until = null;
        this.timer = null;
    }
    read() {
        let descriptor;
        try {
            descriptor = fs.openSync(this.file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
            const metadata = fs.fstatSync(descriptor);
            if (!metadata.isFile() || metadata.size > 512000 ||
                (process.getuid && (metadata.uid !== process.getuid() || (metadata.mode & 0o077)))) return null;
            return countdownFromStatus(JSON.parse(fs.readFileSync(descriptor, 'utf8')));
        } catch { return null; }
        finally { if (descriptor !== undefined) fs.closeSync(descriptor); }
    }
    start(onChange) {
        const tick = () => { const until = this.read(); const changed = until !== this.until; this.until = until; if (changed || until) onChange(until); };
        tick(); this.timer = setInterval(tick, 1000); this.timer.unref();
    }
    stop() { clearInterval(this.timer); }
}
module.exports = { SituateReader, countdownFromStatus };
