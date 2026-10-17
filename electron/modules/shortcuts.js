const DEFAULT_SHORTCUTS = {
    subtractMinute: 'Alt+Shift+Q',
    addMinute: 'Alt+Shift+W',
    subtractFiveMinutes: 'Alt+Shift+A',
    addFiveMinutes: 'Alt+Shift+S',
    startPomodoro: 'Alt+Shift+Z',
    toggleWindow: 'Alt+Shift+X',
};

function normalizeShortcut(value) {
    if (typeof value !== 'string') throw new Error('Enter a shortcut as text.');
    return value.trim().replace(/\s*\+\s*/g, '+')
        .replace(/\bOption\b/gi, 'Alt')
        .replace(/\bCommand\b/gi, 'Command')
        .replace(/\bControl\b/gi, 'Control');
}

class ShortcutManager {
    constructor(globalShortcut, actions) {
        this.globalShortcut = globalShortcut;
        this.actions = actions;
        this.shortcuts = {};
    }

    register(action, shortcut) {
        if (!shortcut) return;
        try {
            if (!this.globalShortcut.isRegistered(shortcut)
                && this.globalShortcut.register(shortcut, this.actions[action])) return;
        } catch { /* Invalid Electron accelerator. */ }
        throw new Error(`Shortcut "${shortcut}" is invalid or already in use. Choose another combination.`);
    }

    load(shortcuts) {
        this.shortcuts = { ...DEFAULT_SHORTCUTS, ...shortcuts };
        for (const action of Object.keys(DEFAULT_SHORTCUTS)) {
            try {
                this.register(action, this.shortcuts[action]);
            } catch (error) {
                console.error(error.message);
            }
        }
    }

    update(shortcuts) {
        const next = {};
        for (const action of Object.keys(DEFAULT_SHORTCUTS)) {
            next[action] = normalizeShortcut(shortcuts[action] ?? this.shortcuts[action]);
        }
        if (Object.keys(next).every(action => next[action] === this.shortcuts[action])) {
            return { ...next };
        }
        this.globalShortcut.unregisterAll();
        try {
            for (const action of Object.keys(next)) this.register(action, next[action]);
        } catch (error) {
            this.globalShortcut.unregisterAll();
            this.load(this.shortcuts);
            throw error;
        }
        this.shortcuts = next;
        return { ...next };
    }
}

module.exports = { DEFAULT_SHORTCUTS, ShortcutManager };
