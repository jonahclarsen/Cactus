<script>
    export let state;
    export let crayon;

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, "0")}`;
    }

    $: timerColor = state.timer?.isBreak ? crayon.gray : crayon.primary;
</script>

<div class="timer" style="color:{timerColor}">
    {formatTime(state.timer?.remainingSeconds || 0)}
</div>

<style>
    .timer {
        font-size: 100px;
        font-weight: 900;
        text-align: center;
        letter-spacing: 2px;
        text-shadow: 0 1px 0 var(--surface);
        margin-top: 5px;
    }
</style>
