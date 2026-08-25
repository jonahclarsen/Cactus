const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const ALERT_FONTS = require('../alert-fonts.json');

const ALERT_FONT_KEYS = new Set(ALERT_FONTS.map((font) => font.id));

const DEFAULT_SETTINGS = {
    theme: 'violet',
    traySymbol: 'cactus',
    completionAlertFont: 'lucida-grande',
    completionAlertWeight: 900,
    acceptableHourRange: 6,
    durations: { workMinutes: 30, breakMinutes: 3 },
    soundVolume: 100, // Volume for timer end sound (0-100)
};

const LEGACY_THEME_ALIASES = {
    purple: 'violet',
    green: 'forest',
    blue: 'ocean',
    orange: 'sunset',
    neutral: 'graphite',
};

const THEME_KEYS = new Set([
    'violet',
    'forest',
    'ocean',
    'sunset',
    'berry',
    'pink',
    'mint',
    'midnight',
    'graphite',
    'iridescent',
]);

function normalizeThemeKey(themeKey) {
    const normalized = LEGACY_THEME_ALIASES[themeKey] || themeKey;
    return THEME_KEYS.has(normalized) ? normalized : DEFAULT_SETTINGS.theme;
}

function normalizeAlertFont(fontKey) {
    return ALERT_FONT_KEYS.has(fontKey) ? fontKey : DEFAULT_SETTINGS.completionAlertFont;
}

function normalizeAlertWeight(weight) {
    const numericWeight = Number(weight);
    if (!Number.isFinite(numericWeight)) return DEFAULT_SETTINGS.completionAlertWeight;
    return Math.min(900, Math.max(100, Math.round(numericWeight / 100) * 100));
}

const DEFAULT_STATE = {
    timer: { running: false, isBreak: false, remainingSeconds: 0, endTs: 0, initialSeconds: 0 },
    lastEnded: null,
};

class StateManager {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.state = { ...DEFAULT_STATE };
        this.dataFilePath = '';
        this.lastBackupDate = '';
        this.saveInterval = null;
    }

    getUserDir() {
        return app.getPath('userData');
    }

    ensureDataDir() {
        const dir = this.getUserDir();
        try { fs.mkdirSync(dir, { recursive: true }); } catch { }
        return dir;
    }

    getDataFilePath() {
        const dir = this.ensureDataDir();
        return path.join(dir, 'balance.json');
    }

    getBackupDir() {
        return path.join(this.getUserDir(), 'config_backups');
    }

    getTodayDateString() {
        const today = new Date();
        return today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');
    }

    maybeBackupDaily() {
        try {
            const srcPath = this.dataFilePath || this.getDataFilePath();
            const today = this.getTodayDateString();
            if (this.lastBackupDate === today) return;

            const backupDir = this.getBackupDir();
            try { fs.mkdirSync(backupDir, { recursive: true }); } catch { }
            const destPath = path.join(backupDir, `balance-${today}.json`);
            try {
                fs.copyFileSync(srcPath, destPath, fs.constants.COPYFILE_EXCL);
                this.lastBackupDate = today;
            } catch (e) {
                if (e && e.code === 'EEXIST') {
                    // Backup for today already exists; mark as done to avoid checks
                    this.lastBackupDate = today;
                }
            }
        } catch (e) {
            // Swallow errors to avoid impacting primary save flow
        }
    }

    loadData() {
        try {
            const p = this.getDataFilePath();
            this.dataFilePath = p;
            if (fs.existsSync(p)) {
                const json = JSON.parse(fs.readFileSync(p, 'utf-8'));
                // Deep merge with defaults to ensure new settings are added
                this.settings = {
                    ...DEFAULT_SETTINGS,
                    ...json.settings,
                    theme: normalizeThemeKey(json.settings?.theme),
                    completionAlertFont: normalizeAlertFont(json.settings?.completionAlertFont),
                    completionAlertWeight: normalizeAlertWeight(json.settings?.completionAlertWeight),
                    durations: { ...DEFAULT_SETTINGS.durations, ...(json.settings?.durations || {}) }
                };
                this.state = {
                    ...DEFAULT_STATE,
                    ...json.state,
                    timer: { ...DEFAULT_STATE.timer, ...(json.state?.timer || {}) }
                };
            } else {
                this.saveData();
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
    }

    saveData() {
        try {
            const p = this.getDataFilePath();
            this.dataFilePath = p;
            const payload = { settings: this.settings, state: this.state };
            fs.writeFileSync(p, JSON.stringify(payload, null, 2), 'utf-8');
            this.maybeBackupDaily();
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    }

    startAutoSave() {
        if (this.saveInterval) clearInterval(this.saveInterval);
        // Save every 2 minutes
        this.saveInterval = setInterval(() => this.saveData(), 2 * 60 * 1000);
    }

    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }

    updateSettings(nextSettings) {
        const prevDir = this.getUserDir();
        this.settings = {
            ...this.settings,
            ...nextSettings,
            theme: normalizeThemeKey(nextSettings.theme ?? this.settings.theme),
            completionAlertFont: normalizeAlertFont(
                nextSettings.completionAlertFont ?? this.settings.completionAlertFont
            ),
            completionAlertWeight: normalizeAlertWeight(
                nextSettings.completionAlertWeight ?? this.settings.completionAlertWeight
            ),
        };

        const newDir = this.getUserDir();
        if (newDir !== prevDir) {
            try { fs.mkdirSync(newDir, { recursive: true }); } catch { }
            const newPath = path.join(newDir, 'balance.json');
            fs.writeFileSync(newPath, JSON.stringify({ settings: this.settings, state: this.state }, null, 2), 'utf-8');
            this.dataFilePath = newPath;
        } else {
            this.saveData();
        }
    }
}

module.exports = { StateManager, DEFAULT_SETTINGS };
