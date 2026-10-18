const { app, globalShortcut } = require('electron');

const { StateManager } = require('./modules/state');
const { TimerManager } = require('./modules/timer');
const { WindowManager } = require('./modules/window');
const { TrayManager } = require('./modules/tray');
const { SoundPlayer } = require('./modules/sound');
const { setupIpcHandlers } = require('./modules/ipc-handlers');
const { SituateReader } = require('./modules/situate');
const situateReader = new SituateReader();
const { ShortcutManager } = require('./modules/shortcuts');

const isDev = !app.isPackaged;
const DEV_PORT = process.env.VITE_DEV_PORT || '5173';

// Initialize managers
const stateManager = new StateManager();
const windowManager = new WindowManager(isDev, DEV_PORT);
const soundPlayer = new SoundPlayer(windowManager, stateManager);
const timerManager = new TimerManager(stateManager, soundPlayer);
const trayManager = new TrayManager(timerManager, windowManager);

app.whenReady().then(() => {
    // Hide dock icon on macOS
    if (process.platform === 'darwin') {
        try {
            app.dock.hide();
        } catch (e) {
            console.error('Failed to hide dock icon:', e);
        }
    }

    // Load data and start auto-save
    stateManager.loadData();
    stateManager.startAutoSave();

    // Create window and tray
    windowManager.createWindow();
    const tray = trayManager.createTray();
    windowManager.setTray(tray);

    // Start timer systems
    timerManager.startTicking();
    timerManager.startMinuteTracking();

    const startWorkIfNeeded = () => {
        // Preserve work sessions with time left, including paused sessions.
        if (!timerManager.state.timer.isBreak && timerManager.timeRemainingSeconds() > 0) {
            return;
        }
        timerManager.startTimer(false);
    };
    tray.on('right-click', startWorkIfNeeded);

    const shortcutManager = new ShortcutManager(globalShortcut, {
        subtractMinute: () => timerManager.extendTimer(-60),
        addMinute: () => timerManager.extendTimer(60),
        subtractFiveMinutes: () => timerManager.extendTimer(-300),
        addFiveMinutes: () => timerManager.extendTimer(300),
        startPomodoro: startWorkIfNeeded,
        toggleWindow: () => windowManager.toggleWindow(),
    });
    shortcutManager.load(stateManager.settings.shortcuts);
    setupIpcHandlers(stateManager, timerManager, windowManager, trayManager, shortcutManager);
    situateReader.start(until => { timerManager.situateUntil = until; timerManager.onTick?.(); });
});

app.on('window-all-closed', (e) => {
    // Prevent full quit on macOS
    if (process.platform === 'darwin') {
        e.preventDefault();
    }
});

app.on('before-quit', () => {
    globalShortcut.unregisterAll();
    stateManager.stopAutoSave();
    timerManager.stop();
    situateReader.stop();
    stateManager.saveData();
});
