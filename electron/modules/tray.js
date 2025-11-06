const { Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('@napi-rs/canvas');

const THEME_PALETTES = {
    pink: {
        bg: "#FFE2F5",
        card: "#FDB3DB",
        stroke: "#BF6091",
        accent: "#E47ED1",
        primary: "#e91e63"
    },
    green: {
        bg: "#E0F2F1",
        card: "#B2DFDB",
        stroke: "#00695C",
        accent: "#4DB6AC",
        primary: "#2e7d32"
    },
    neutral: {
        bg: "#F3F3F3",
        card: "#E8E8E8",
        stroke: "#9E9E9E",
        accent: "#BDBDBD",
        primary: "#8C8C8C"
    },
    blue: {
        bg: "#E3F2FD",
        card: "#90CAF9",
        stroke: "#1565C0",
        accent: "#42A5F5",
        primary: "#1976D2"
    },
    purple: {
        bg: "#F3E5F5",
        card: "#CE93D8",
        stroke: "#6A1B9A",
        accent: "#AB47BC",
        primary: "#8E24AA"
    },
    orange: {
        bg: "#FFF3E0",
        card: "#FFCC80",
        stroke: "#E65100",
        accent: "#FF9800",
        primary: "#F57C00"
    }
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

        const minutesLeft = this.timerManager.secondsToMinutesFloor(this.timerManager.timeRemainingSeconds());
        this.renderTrayImage(minutesLeft, () => { });

        // Only show the minutes as system text; heart timer is in the image
        try { this.tray.setTitle(`${minutesLeft}`); } catch { }

        this.tray.setToolTip(`Timer: ${minutesLeft} minutes remaining`);
    }

    drawHeartPath(ctx, x, y, width, height) {
        // Draw a heart shape using bezier curves
        // The heart is centered at (x, y) with given width and height
        const leftX = x - width / 2;
        const rightX = x + width / 2;
        const topY = y - height / 2;
        const bottomY = y + height / 2;
        const midY = y;
        const heartTopY = topY + height * 0.15; // Top of the heart humps

        ctx.beginPath();
        // Start at bottom point (tip of heart)
        ctx.moveTo(x, bottomY);

        // Left curve: bottom to left hump
        ctx.bezierCurveTo(
            leftX + width * 0.25, bottomY - height * 0.1,
            leftX, midY,
            leftX + width * 0.1, heartTopY
        );

        // Left hump to center top
        ctx.bezierCurveTo(
            leftX + width * 0.15, topY + height * 0.05,
            x - width * 0.05, topY + height * 0.1,
            x, heartTopY
        );

        // Center top to right hump
        ctx.bezierCurveTo(
            x + width * 0.05, topY + height * 0.1,
            rightX - width * 0.15, topY + height * 0.05,
            rightX - width * 0.1, heartTopY
        );

        // Right hump to bottom
        ctx.bezierCurveTo(
            rightX, midY,
            rightX - width * 0.25, bottomY - height * 0.1,
            x, bottomY
        );

        ctx.closePath();
    }

    renderTrayImage(minutesLeft, cb) {
        try {
            // Render at 2x for HiDPI displays
            const scale = 2;
            const pointH = 26;

            // Calculate width based on heart size
            const heartSize = 18 * scale;
            const minWidth = 32 * scale;
            const w = Math.max(minWidth, Math.ceil(heartSize + 8));
            const pointW = Math.ceil(w / scale);
            const h = pointH * scale;

            // Create canvas
            const canvas = createCanvas(w, h);
            const ctx = canvas.getContext('2d');

            // Clear and setup
            ctx.clearRect(0, 0, w, h);
            ctx.imageSmoothingEnabled = true; // Enable smoothing for heart shape

            // Determine colors - use theme from settings
            const themeName = this.settings.theme || 'neutral';
            const theme = THEME_PALETTES[themeName] || THEME_PALETTES.neutral;
            const heartColor = theme.primary;

            // Calculate timer progress (frac is how much has elapsed, 0 to 1)
            const total = this.state.timer.initialSeconds || (this.state.timer.isBreak ?
                (this.settings.durations.breakMinutes) * 60 :
                (this.settings.durations.workMinutes) * 60);
            const rem = Math.max(0, this.timerManager.timeRemainingSeconds());
            const frac = total > 0 ? Math.max(0, Math.min(1, 1 - rem / total)) : 0;

            // Heart dimensions
            const heartWidth = heartSize;
            const heartHeight = heartSize;
            const cx = w / 2;
            const cy = h / 2;

            // Fill heart from bottom to top based on progress
            if (frac > 0) {
                // Save context to apply clipping
                ctx.save();

                // Draw the heart path again for clipping
                this.drawHeartPath(ctx, cx, cy, heartWidth, heartHeight);
                ctx.clip();

                // Calculate fill height (from bottom)
                const fillHeight = heartHeight * frac;
                const fillY = cy + heartHeight / 2 - fillHeight;

                // Fill from bottom to the calculated height
                ctx.fillStyle = heartColor;
                ctx.globalAlpha = 0.8;
                ctx.fillRect(cx - heartWidth / 2, fillY, heartWidth, fillHeight);

                // Restore context
                ctx.restore();
                ctx.globalAlpha = 1;
            }

            // Convert to image buffer and create nativeImage
            const buffer = canvas.toBuffer('image/png');
            let img = nativeImage.createFromBuffer(buffer);
            try { img.setTemplateImage(false); } catch { }

            // Resize for actual display size
            img = img.resize({ width: pointW, height: pointH, quality: 'best' });
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

