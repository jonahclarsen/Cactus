const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const source = readFileSync(path.join(__dirname, '../electron/modules/tray.js'), 'utf8');
const themes = {
    violet: '#8a63b8', forest: '#3f9d54', ocean: '#278b9f', sunset: '#c77832',
    berry: '#b45672', pink: '#e76f89', mint: '#42a878', midnight: '#596fbb',
    graphite: '#777774', iridescent: '#28a987',
};

async function render(theme, symbol, remainingSeconds, alert = false) {
    let image;
    const errors = [];
    const context = {
        module: { exports: {} },
        __dirname: path.join(__dirname, '../electron/modules'),
        console: { error: (...args) => errors.push(args) },
        require(name) {
            if (name === 'electron') return {
                app: { getPath: () => '/nonexistent' },
                nativeImage: {
                    createFromBuffer(buffer) {
                        return {
                            resize(size) {
                                return {
                                    buffer, size, template: true,
                                    setTemplateImage(value) { this.template = value; },
                                };
                            },
                        };
                    },
                },
            };
            if (name === './tray-symbols') return require('../electron/modules/tray-symbols');
            return require(name);
        },
    };
    vm.runInNewContext(source, context);
    const manager = new context.module.exports.TrayManager({
        settings: { theme, traySymbol: symbol, durations: { workMinutes: 30, breakMinutes: 3 } },
        state: { timer: { initialSeconds: 1800 } },
        timeRemainingSeconds: () => remainingSeconds,
    }, {});
    manager.tray = { setImage(value) { image = value; } };
    manager.renderTrayImage(0, alert, () => {});
    assert.deepEqual(errors, []);
    assert.equal(image.template, false, 'the final resized image must retain color on macOS');
    // Check actual pixels at the displayed size, including resampling of the outline.
    const canvas = createCanvas(image.size.width, image.size.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(await loadImage(image.buffer), 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
}

for (const [theme, hex] of Object.entries(themes)) {
    for (const symbol of ['heart', 'cactus']) {
        test(`${theme} ${symbol} retains its chosen color throughout the timer`, async () => {
            const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16));
            for (const remaining of [1800, 900, 0]) {
                const pixels = await render(theme, symbol, remaining, remaining === 0);
                let solidColorPixels = 0;
                for (let i = 0; i < pixels.length; i += 4) {
                    if (pixels[i + 3] >= 230 && rgb.every((value, j) => Math.abs(pixels[i + j] - value) <= 3)) {
                        solidColorPixels++;
                    }
                }
                assert.ok(solidColorPixels >= 8, `chosen color should stay visible with ${remaining}s left`);
            }
        });
    }
}
