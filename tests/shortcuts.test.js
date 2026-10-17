const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DEFAULT_SHORTCUTS, ShortcutManager } = require('../electron/modules/shortcuts');

function createShortcuts(unavailable = new Set()) {
    const registered = new Map();
    const calls = [];
    const actions = Object.fromEntries(Object.keys(DEFAULT_SHORTCUTS).map(action => [action, () => calls.push(action)]));
    const manager = new ShortcutManager({
        isRegistered: shortcut => registered.has(shortcut.toLowerCase()),
        register(shortcut, callback) {
            if (unavailable.has(shortcut)) return false;
            if (shortcut === 'Invalid') throw new Error('Invalid accelerator');
            registered.set(shortcut.toLowerCase(), callback);
            return true;
        },
        unregisterAll() { registered.clear(); },
    }, actions);
    manager.load(DEFAULT_SHORTCUTS);
    return { manager, registered, calls };
}

test('defaults bind the requested actions to Q/W, A/S, and Z', () => {
    const { registered, calls } = createShortcuts();
    for (const key of ['q', 'w', 'a', 's', 'z']) registered.get(`alt+shift+${key}`)();
    assert.deepEqual(calls, ['subtractMinute', 'addMinute', 'subtractFiveMinutes', 'addFiveMinutes', 'startPomodoro']);
    assert.equal(registered.has('alt+shift+d'), false);
    assert.equal(registered.has('alt+shift+f'), false);
});

test('customization replaces old bindings immediately, accepts Option, and supports disabling', () => {
    const { manager, registered, calls } = createShortcuts();
    const result = manager.update({ ...DEFAULT_SHORTCUTS, addMinute: ' Option + Shift + E ', toggleWindow: '' });
    assert.equal(result.addMinute, 'Alt+Shift+E');
    assert.equal(registered.has('alt+shift+w'), false);
    assert.equal(registered.has('alt+shift+x'), false);
    registered.get('alt+shift+e')();
    assert.deepEqual(calls, ['addMinute']);
});

test('unavailable, invalid, and duplicate shortcuts restore every previous binding', () => {
    for (const shortcut of ['Alt+Shift+E', 'Invalid', 'Alt+Shift+Q']) {
        const { manager, registered, calls } = createShortcuts(new Set(['Alt+Shift+E']));
        assert.throws(() => manager.update({ ...DEFAULT_SHORTCUTS, addMinute: shortcut }), /invalid or already in use/);
        assert.deepEqual(manager.shortcuts, DEFAULT_SHORTCUTS);
        assert.equal(registered.size, 6);
        registered.get('alt+shift+w')();
        assert.deepEqual(calls, ['addMinute']);
    }
});

test('loading saved customizations preserves disabled shortcuts and fills new defaults', () => {
    const { manager, registered } = createShortcuts();
    registered.clear();
    manager.load({ addMinute: 'Alt+Shift+E', startPomodoro: '' });
    assert.equal(registered.has('alt+shift+e'), true);
    assert.equal(registered.has('alt+shift+z'), false);
    assert.equal(registered.has('alt+shift+q'), true);
});
