const { app, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

/**
 * Sound player module for playing timer end sound
 * Uses BrowserWindow webContents to play audio via HTML5 Audio API
 */
class SoundPlayer {
    constructor(windowManager, stateManager = null) {
        this.windowManager = windowManager;
        this.stateManager = stateManager;
    }

    /**
     * Get the path to the sound file
     * Handles both development and production paths
     */
    getSoundFilePath() {
        const isDev = !app.isPackaged;
        const soundFileName = 'timer-end.mp3';
        
        if (isDev) {
            // Development: look in electron/assets/sounds/
            return path.join(__dirname, '../assets/sounds', soundFileName);
        } else {
            // Production: try multiple possible locations
            const possiblePaths = [
                path.join(__dirname, '../assets/sounds', soundFileName),
                path.join(process.resourcesPath, 'app/electron/assets/sounds', soundFileName),
                path.join(process.resourcesPath, 'electron/assets/sounds', soundFileName),
                path.join(__dirname, '../../../electron/assets/sounds', soundFileName)
            ];

            for (const testPath of possiblePaths) {
                if (fs.existsSync(testPath)) {
                    return testPath;
                }
            }

            // Fallback to first path
            return possiblePaths[0];
        }
    }

    /**
     * Play the timer end sound
     * Falls back to Electron's system beep if the sound is unavailable
     */
    playTimerEndSound() {
        const soundPath = this.getSoundFilePath();
        
        // Check if sound file exists
        if (!fs.existsSync(soundPath)) {
            console.log('Sound file not found, falling back to beep:', soundPath);
            try {
                shell.beep();
            } catch (e) {
                console.error('Failed to play beep:', e);
            }
            return;
        }

        // Get the main window to play audio
        const mainWindow = this.windowManager ? this.windowManager.getWindow() : null;
        
        if (!mainWindow || !mainWindow.webContents) {
            console.log('Window not available, falling back to beep');
            try {
                shell.beep();
            } catch (e) {
                console.error('Failed to play beep:', e);
            }
            return;
        }

        // Use a properly encoded file URL so installed paths containing spaces work.
        const soundUrl = pathToFileURL(soundPath).href;
        
        // Get volume from settings (0-100, convert to 0-1)
        const volumeSetting = this.stateManager && this.stateManager.settings 
            ? (this.stateManager.settings.soundVolume !== undefined ? this.stateManager.settings.soundVolume : 100)
            : 100;
        const volume = Math.max(0, Math.min(1, volumeSetting / 100));
        
        console.log('Playing sound with volume:', volumeSetting, '% (', volume, ')');
        
        // Keep the element reachable until playback ends. Returning the play promise
        // also lets executeJavaScript report media errors to the main process.
        mainWindow.webContents.executeJavaScript(`
            (async function() {
                try {
                    const audio = new Audio(${JSON.stringify(soundUrl)});
                    audio.volume = ${volume};
                    window.__cactusTimerEndAudio = audio;
                    audio.addEventListener('ended', function() {
                        if (window.__cactusTimerEndAudio === audio) {
                            window.__cactusTimerEndAudio = null;
                        }
                    }, { once: true });
                    await audio.play();
                    return { ok: true };
                } catch (err) {
                    window.__cactusTimerEndAudio = null;
                    return {
                        ok: false,
                        error: err && err.message ? err.message : String(err),
                    };
                }
            })();
        `, true).then((result) => {
            if (!result || !result.ok) {
                throw new Error(result && result.error ? result.error : 'Unknown media playback error');
            }
        }).catch((err) => {
            console.error('Failed to play timer end sound, falling back to beep:', err);
            try {
                shell.beep();
            } catch (e) {
                console.error('Failed to play beep:', e);
            }
        });
    }
}

module.exports = { SoundPlayer };
