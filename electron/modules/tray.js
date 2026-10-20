const { app, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const { drawTraySymbolPath } = require('./tray-symbols');

const ALERT_FONT_SIZE = 24;
const ALERT_FONT_FILENAME = 'PPPangramSansRounded-Bold.otf';
const ALERT_FONT_FALLBACK_FAMILY = '"PP Pangram Sans Rounded", sans-serif';
const ALERT_WEIGHT = 1000;
const ALERT_VERTICAL_OFFSET = 2;
let alertFont = null;

function resolveAlertFont() {
    if (alertFont) return alertFont;

    const alias = 'Cactus Pangram Rounded';
    const fontDirectories = [
        path.join(app.getPath('home'), 'Library', 'Fonts'),
        '/Library/Fonts',
        '/System/Library/Fonts',
    ];
    const facePath = fontDirectories
        .map((directory) => path.join(directory, ALERT_FONT_FILENAME))
        .find((candidate) => fs.existsSync(candidate));
    alertFont = facePath && GlobalFonts.registerFromPath(facePath, alias)
        ? { family: `"${alias}"`, weight: 400 }
        : { family: ALERT_FONT_FALLBACK_FAMILY, weight: 900 };
    return alertFont;
}

const THEME_PRIMARY_COLORS = {
    violet: '#8a63b8',
    forest: '#3f9d54',
    ocean: '#278b9f',
    sunset: '#c77832',
    berry: '#b45672',
    pink: '#e76f89',
    mint: '#42a878',
    midnight: '#596fbb',
    graphite: '#777774',
    iridescent: '#28a987',
};

class TrayManager {
    constructor(timerManager, windowManager) {
        this.timerManager = timerManager;
        this.windowManager = windowManager;
        this.tray = null;
    }

    get state() {
        return this.timerManager.state;
    }

    get settings() {
        return this.timerManager.settings;
    }

    createTray() {
        // Base icon with transparent fallback
        let image;
        try {
            let iconPath = path.join(__dirname, '../trayTemplate.png');
            if (!fs.existsSync(iconPath)) {
                iconPath = path.join(__dirname, '../tray.png');
            }
            if (fs.existsSync(iconPath)) {
                image = nativeImage.createFromPath(iconPath);
            }
        } catch { }
        if (!image || image.isEmpty()) {
            const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottQAAAABJRU5ErkJggg==';
            image = nativeImage.createFromDataURL(transparentPixel);
        }
        this.tray = new Tray(image);
        this.updateTrayTitleAndIcon();
        // Remove context menu to hide system menu - only handle click events
        this.tray.on('click', () => this.windowManager.toggleWindow());

        return this.tray;
    }

    updateTrayTitleAndIcon() {
        if (!this.tray) return;

        const remainingSeconds = this.timerManager.displayRemainingSeconds();
        const minutesLeft = this.timerManager.secondsToMinutesFloor(remainingSeconds);
        const showZeroAlert = remainingSeconds <= 0 && Boolean(this.state.lastEnded);
        this.renderTrayImage(minutesLeft, showZeroAlert, () => { });

        // Zero uses the red canvas alert rendered beside the symbol below.
        const trayTitle = showZeroAlert ? '' : String(minutesLeft);
        try { this.tray.setTitle(trayTitle); } catch { }

        this.tray.setToolTip(`${this.timerManager.situateUntil ? "Situate" : "Timer"}: ${minutesLeft} minutes remaining`);
    }

    renderTrayImage(minutesLeft, showZeroAlert, cb) {
        try {
            // Render at 2x for HiDPI displays
            const scale = 2;
            const pointH = 26;

            const symbol = this.settings.traySymbol === 'heart' ? 'heart' : 'cactus';
            const symbolSize = (symbol === 'heart' ? 19 : 18) * scale;
            const symbolHeight = symbol === 'heart' ? symbolSize * 0.97 : symbolSize;
            const alertGap = 4 * scale;
            const alertWidth = 14 * scale;
            const contentWidth = symbolSize + (showZeroAlert ? alertGap + alertWidth : 0);
            const horizontalPadding = 2 * scale;
            const minWidth = 32 * scale;
            const w = Math.max(minWidth, Math.ceil(contentWidth + horizontalPadding * 2));
            const pointW = Math.ceil(w / scale);
            const h = pointH * scale;

            // Create canvas
            const canvas = createCanvas(w, h);
            const ctx = canvas.getContext('2d');

            // Clear and setup
            ctx.clearRect(0, 0, w, h);
            ctx.imageSmoothingEnabled = true;

            // Determine colors - use theme from settings
            const symbolColor = THEME_PRIMARY_COLORS[this.settings.theme] || THEME_PRIMARY_COLORS.violet;

            // Calculate timer progress (frac is how much has elapsed, 0 to 1)
            const total = this.state.timer.initialSeconds || (this.state.timer.isBreak ?
                (this.settings.durations.breakMinutes) * 60 :
                (this.settings.durations.workMinutes) * 60);
            const rem = Math.max(0, this.timerManager.timeRemainingSeconds());
            const frac = total > 0 ? Math.max(0, Math.min(1, 1 - rem / total)) : 0;

            const cx = showZeroAlert
                ? (w - contentWidth) / 2 + symbolSize / 2
                : w / 2;
            const cy = h / 2;

            // Keep the complete silhouette visible while progress fills it in.
            drawTraySymbolPath(ctx, symbol, cx, cy, symbolSize, symbolHeight);
            ctx.fillStyle = symbolColor;
            ctx.globalAlpha = 0.22;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Fill the selected symbol from bottom to top based on progress.
            if (frac > 0) {
                // Save context to apply clipping
                ctx.save();

                drawTraySymbolPath(ctx, symbol, cx, cy, symbolSize, symbolHeight);
                ctx.clip();

                // Calculate fill height (from bottom)
                const fillHeight = symbolHeight * frac;
                const fillY = cy + symbolHeight / 2 - fillHeight;

                // Fill from bottom to the calculated height
                ctx.fillStyle = symbolColor;
                ctx.globalAlpha = 1;
                ctx.fillRect(cx - symbolSize / 2, fillY, symbolSize, fillHeight);

                // Restore context
                ctx.restore();
                ctx.globalAlpha = 1;
            }

            // Keep the chosen color visible even before the progress fill rises.
            // A translucent silhouette alone washes out against the menu bar.
            drawTraySymbolPath(ctx, symbol, cx, cy, symbolSize, symbolHeight);
            ctx.strokeStyle = symbolColor;
            ctx.lineWidth = scale;
            ctx.lineJoin = 'round';
            ctx.stroke();

            if (showZeroAlert) {
                const alertX = cx + symbolSize / 2 + alertGap + alertWidth / 2;
                const alertY = cy + ALERT_VERTICAL_OFFSET * scale;
                const font = resolveAlertFont();
                ctx.font = `${font.weight} ${ALERT_FONT_SIZE * scale}px ${font.family}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#e34b4f';
                const extraStrokeWidth = (ALERT_WEIGHT - 900) / 100 * 0.5 * scale;
                ctx.lineJoin = 'round';
                ctx.lineWidth = extraStrokeWidth;
                ctx.strokeStyle = '#e34b4f';
                ctx.strokeText('!', alertX, alertY);
                ctx.fillText('!', alertX, alertY);
            }

            // Convert to image buffer and create nativeImage
            const buffer = canvas.toBuffer('image/png');
            let img = nativeImage.createFromBuffer(buffer);
            // Resize for actual display size
            img = img.resize({ width: pointW, height: pointH, quality: 'best' });
            img.setTemplateImage(false);
            this.tray.setImage(img);
        } catch (e) {
            console.error('Failed to render tray image:', e);
        }
        cb();
    }

    getTray() {
        return this.tray;
    }
}

module.exports = { TrayManager };
