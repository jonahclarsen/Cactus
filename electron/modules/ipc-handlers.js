const { app, ipcMain, shell } = require('electron');

function setupIpcHandlers(stateManager, timerManager, windowManager, trayManager) {

    function getPublicState() {
        return {
            settings: stateManager.settings,
            state: {
                ...stateManager.state,
                timer: { ...stateManager.state.timer, remainingSeconds: timerManager.timeRemainingSeconds() }
            },
            computed: {}
        };
    }

    function notifyRenderer(type) {
        const mainWindow = windowManager.getWindow();
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('cactus:state', { type, payload: getPublicState() });
        }
    }

    // Set up callbacks
    timerManager.onTick = () => {
        notifyRenderer('state');
        trayManager.updateTrayTitleAndIcon();
    };

    timerManager.onEnd = () => {
        notifyRenderer('timer-ended');
        // windowManager.showWindowNearTray();
    };

    // Register IPC handlers
    ipcMain.handle('cactus:get-state', () => getPublicState());

    // Read from macOS so changes made in System Settings stay authoritative.
    ipcMain.handle('cactus:get-login-settings', () => ({
        supported: process.platform === 'darwin',
        available: process.platform === 'darwin' && app.isPackaged,
        openAtLogin: process.platform === 'darwin' && app.isPackaged
            ? app.getLoginItemSettings().openAtLogin
            : false,
    }));

    ipcMain.handle('cactus:set-login-settings', (_event, openAtLogin) => {
        if (process.platform !== 'darwin' || !app.isPackaged) {
            throw new Error('Launch at login is only available in the macOS release app.');
        }
        if (typeof openAtLogin !== 'boolean') {
            throw new TypeError('Launch at login must be a boolean.');
        }
        app.setLoginItemSettings({ openAtLogin });
        const actual = app.getLoginItemSettings().openAtLogin;
        if (actual !== openAtLogin) {
            throw new Error('macOS did not apply the login setting. Check System Settings > General > Login Items & Extensions.');
        }
        return actual;
    });

    ipcMain.handle('cactus:start-work', () => {
        timerManager.startTimer(false);
        return getPublicState();
    });

    ipcMain.handle('cactus:start-break', () => {
        timerManager.startTimer(true);
        return getPublicState();
    });

    ipcMain.handle('cactus:stop', () => {
        timerManager.stopTimer();
        return getPublicState();
    });

    ipcMain.handle('cactus:pause', () => {
        timerManager.pauseTimer();
        return getPublicState();
    });

    ipcMain.handle('cactus:resume', () => {
        timerManager.resumeTimer();
        return getPublicState();
    });

    ipcMain.handle('cactus:extend', (_e, seconds) => {
        timerManager.extendTimer(seconds);
        return getPublicState();
    });

    ipcMain.handle('cactus:save-settings', (_e, nextSettings) => {
        stateManager.updateSettings(nextSettings);
        notifyRenderer('state');
        trayManager.updateTrayTitleAndIcon();
        return getPublicState();
    });

    ipcMain.handle('cactus:open', () => {
        windowManager.showWindowNearTray();
    });

    ipcMain.handle('cactus:open-data-folder', () => {
        try {
            shell.openPath(stateManager.getUserDir());
        } catch (e) {
            console.error('Failed to open data folder:', e);
        }
    });

    ipcMain.handle('cactus:open-github', () => {
        try {
            shell.openExternal('https://github.com/jonahclarsen/Cactus');
        } catch (e) {
            console.error('Failed to open GitHub:', e);
        }
    });

    ipcMain.handle('cactus:quit', () => {
        const { app } = require('electron');
        app.quit();
    });
}

module.exports = { setupIpcHandlers };

