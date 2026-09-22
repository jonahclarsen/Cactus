const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const timerSource = readFileSync(path.join(__dirname, '../electron/modules/timer.js'), 'utf8');

function createTimer() {
    let now = 100000;
    let tick;
    let sounds = 0;
    let ends = 0;
    const context = {
        module: { exports: {} },
        require: (name) => {
            assert.equal(name, 'electron');
            return { shell: { beep() { throw new Error('Unexpected fallback beep'); } } };
        },
        Date: { now: () => now },
        setInterval: (callback, delay) => {
            assert.equal(delay, 1000);
            tick = callback;
            return 1;
        },
        clearInterval() {},
        setTimeout() {},
    };
    vm.runInNewContext(timerSource, context);
    const manager = new context.module.exports.TimerManager({
        state: { timer: {}, lastEnded: null },
        settings: { durations: { workMinutes: 8, breakMinutes: 3 } },
        saveData() {},
    }, { playTimerEndSound() { sounds++; } });
    manager.onEnd = () => ends++;
    manager.startTimer(false);
    manager.startTicking();
    return {
        manager,
        elapse(ms) { now += ms; },
        tick() { tick(); },
        get sounds() { return sounds; },
        get ends() { return ends; },
    };
}

test('quick subtraction clamps at zero and additions start from zero', () => {
    const { manager } = createTimer();
    manager.extendTimer(-300);
    assert.equal(manager.timeRemainingSeconds(), 180);
    manager.extendTimer(-300);
    assert.equal(manager.timeRemainingSeconds(), 0);
    manager.extendTimer(300);
    assert.equal(manager.timeRemainingSeconds(), 300);
    manager.extendTimer(300);
    assert.equal(manager.timeRemainingSeconds(), 600);
});

test('adding during the zero grace period cancels completion without losing time', () => {
    const timer = createTimer();
    timer.manager.extendTimer(-600);
    timer.manager.extendTimer(-300);
    timer.elapse(800);
    assert.equal(timer.sounds, 0);
    assert.equal(timer.manager.state.timer.running, true);
    timer.manager.extendTimer(300);
    assert.equal(timer.manager.timeRemainingSeconds(), 300);
    timer.elapse(200);
    timer.tick();
    assert.equal(timer.sounds, 0);
    assert.equal(timer.ends, 0);
    assert.equal(timer.manager.state.timer.running, true);
    assert.equal(timer.manager.state.lastEnded, null);
});

test('manual zero still completes on the next one-second tick, exactly once', () => {
    const timer = createTimer();
    timer.manager.extendTimer(-600);
    assert.equal(timer.sounds, 0);
    assert.equal(timer.ends, 0);
    timer.elapse(1000);
    timer.tick();
    assert.equal(timer.sounds, 1);
    assert.equal(timer.ends, 1);
    assert.equal(timer.manager.state.timer.running, false);
    timer.elapse(1000);
    timer.tick();
    assert.equal(timer.sounds, 1);
    timer.manager.extendTimer(300);
    assert.equal(timer.manager.timeRemainingSeconds(), 300);
    assert.equal(timer.manager.state.timer.running, true);
    assert.equal(timer.manager.state.lastEnded, null);
});

test('ordinary running adjustments preserve fractional seconds', () => {
    const timer = createTimer();
    timer.elapse(250);
    timer.manager.extendTimer(300);
    assert.equal(timer.manager.state.timer.endTs, 880000);
    assert.equal(timer.manager.timeRemainingSeconds(), 779);
});

test('paused adjustments clamp at zero and stay paused', () => {
    const { manager } = createTimer();
    manager.pauseTimer();
    manager.extendTimer(-600);
    manager.extendTimer(300);
    assert.equal(manager.timeRemainingSeconds(), 300);
    assert.equal(manager.state.timer.running, false);
});
