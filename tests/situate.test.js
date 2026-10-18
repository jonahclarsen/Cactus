const { test } = require('node:test');
const assert = require('node:assert/strict');
const { countdownFromStatus } = require('../electron/modules/situate');
test('only a current night pass supplies a countdown', () => {
    const status = {version:1,enabled:true,aiBlocked:false,countdownUntil:5000,refreshAt:5000};
    assert.equal(countdownFromStatus(status,1000),5000);
    for(const patch of [{aiBlocked:true},{enabled:false},{countdownUntil:0},{refreshAt:999},{version:2}]) assert.equal(countdownFromStatus({...status,...patch},1000),null);
    assert.equal(countdownFromStatus(status,5000),null);
});

test('reader rejects public files, symlinks, malformed and oversized feeds', () => {
    const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
    const { SituateReader } = require('../electron/modules/situate');
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cactus-situate-'));
    const file = path.join(directory, 'status.json');
    const until = Date.now() + 60000;
    try {
        fs.writeFileSync(file, JSON.stringify({version:1,enabled:true,aiBlocked:false,countdownUntil:until,refreshAt:until}), {mode:0o600});
        assert.equal(new SituateReader(file).read(),until);
        fs.chmodSync(file,0o644); assert.equal(new SituateReader(file).read(),null);
        fs.chmodSync(file,0o600);
        const link=path.join(directory,'link');fs.symlinkSync(file,link);assert.equal(new SituateReader(link).read(),null);
        fs.writeFileSync(file,'invalid');assert.equal(new SituateReader(file).read(),null);
        fs.writeFileSync(file,' '.repeat(512001));assert.equal(new SituateReader(file).read(),null);
        fs.unlinkSync(file);assert.equal(new SituateReader(file).read(),null);
    } finally { fs.rmSync(directory,{recursive:true,force:true}); }
});
