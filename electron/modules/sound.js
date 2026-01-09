const { app } = require('electron');
const path = require('path');
const fs = require('fs');

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
     * Falls back to app.beep() if sound file doesn't exist or playback fails
     */
    playTimerEndSound() {
        const soundPath = this.getSoundFilePath();
        
        // Check if sound file exists
        if (!fs.existsSync(soundPath)) {
            console.log('Sound file not found, falling back to beep:', soundPath);
            try {
                app.beep();
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
                app.beep();
            } catch (e) {
                console.error('Failed to play beep:', e);
            }
            return;
        }

        // Convert path to file:// URL for webContents
        const soundUrl = `file://${soundPath}`;
        
        // Get volume from settings (0-100, convert to 0-1)
        const volumeSetting = this.stateManager && this.stateManager.settings 
            ? (this.stateManager.settings.soundVolume !== undefined ? this.stateManager.settings.soundVolume : 100)
            : 100;
        const volume = Math.max(0, Math.min(1, volumeSetting / 100));
        
        console.log('Playing sound with volume:', volumeSetting, '% (', volume, ')');
        
        // Play sound using webContents.executeJavaScript
        // This uses HTML5 Audio API in the renderer process
        mainWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    const audio = new Audio(${JSON.stringify(soundUrl)});
                    audio.volume = ${volume};
                    audio.play().catch(function(err) {
                        console.error('Failed to play sound:', err);
                        // Fallback to beep if audio play fails
                        if (window.electron && window.electron.beep) {
                            window.electron.beep();
                        }
                    });
                } catch (err) {
                    console.error('Error creating audio:', err);
                    // Fallback to beep
                    if (window.electron && window.electron.beep) {
                        window.electron.beep();
                    }
                }
            })();
        `).catch((err) => {
            console.error('Failed to execute sound playback script:', err);
            // Fallback to beep
            try {
                app.beep();
            } catch (e) {
                console.error('Failed to play beep:', e);
            }
        });
    }
}

module.exports = { SoundPlayer };
