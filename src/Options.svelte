<script>
    import { createEventDispatcher } from "svelte";
    import { THEME_PALETTES, normalizeThemeKey } from "./themes.js";
    import ALERT_FONTS from "../electron/alert-fonts.json";
    import "./button.css";

    export let editingSettings;
    export let api;

    const dispatch = createEventDispatcher();
    const ALERT_WEIGHT_LABELS = {
        100: "Hairline",
        200: "Extra Light",
        300: "Light",
        400: "Regular",
        500: "Medium",
        600: "Semibold",
        700: "Bold",
        800: "Extra Bold",
        900: "Black",
        1000: "Extra Black",
        1100: "Heavy",
        1200: "Extra Heavy",
        1300: "Ultra",
        1400: "Ultra Heavy",
        1500: "Maximum",
    };

    function persistOptions() {
        const snapshot = JSON.parse(JSON.stringify(editingSettings));
        api.saveSettings(snapshot).catch((error) => {
            console.error("Could not save options:", error);
        });
    }

    function chooseTheme(theme) {
        editingSettings = { ...editingSettings, theme };
        persistOptions();
    }

    function chooseTraySymbol(traySymbol) {
        editingSettings = { ...editingSettings, traySymbol };
        persistOptions();
    }

    function chooseCompletionAlertFont(completionAlertFont) {
        editingSettings = { ...editingSettings, completionAlertFont };
        persistOptions();
    }

    function updateCompletionAlertWeight(event) {
        editingSettings = {
            ...editingSettings,
            completionAlertWeight: Number(event.currentTarget.value),
        };
        persistOptions();
    }

    function updateDuration(duration, event) {
        const value = Math.max(1, Number(event.currentTarget.value) || 1);
        editingSettings = {
            ...editingSettings,
            durations: { ...editingSettings.durations, [duration]: value },
        };
        persistOptions();
    }

    function updateSoundVolume(event) {
        editingSettings = {
            ...editingSettings,
            soundVolume: Number(event.currentTarget.value),
        };
        persistOptions();
    }

    function closeOptions() {
        dispatch("close");
    }

    function openDataFolder() {
        api.openDataFolder();
    }

    function openGithub() {
        api.openGithub();
    }

    function quit() {
        api.quit();
    }

    $: activeTheme = normalizeThemeKey(editingSettings.theme);
    $: activeAlertFont = ALERT_FONTS.some(
        (font) => font.id === editingSettings.completionAlertFont,
    )
        ? editingSettings.completionAlertFont
        : "lucida-grande";
    $: activeAlertWeight = Math.min(
        1500,
        Math.max(
            100,
            Math.round((Number(editingSettings.completionAlertWeight) || 900) / 100) * 100,
        ),
    );
    $: previewAlertWeight = Math.min(activeAlertWeight, 900);
    $: previewAlertStrokeWidth = Math.max(0, (activeAlertWeight - 900) / 100 * 0.5);
</script>

<div class="options root">
    <div class="sheet">
        <div class="title"><h2>Options</h2></div>

        <div class="section">
            <h3>Theme</h3>
            <div class="theme-grid" role="group" aria-label="Theme">
                {#each Object.entries(THEME_PALETTES) as [themeKey, theme]}
                    <button
                        type="button"
                        class="theme-option"
                        class:active={activeTheme === themeKey}
                        aria-pressed={activeTheme === themeKey}
                        title={theme.description}
                        on:click={() => chooseTheme(themeKey)}
                    >
                        <span class="theme-swatches" aria-hidden="true">
                            {#each theme.swatches as swatch}
                                <span style={`--theme-swatch: ${swatch}`}></span>
                            {/each}
                        </span>
                        <span class="theme-name">{theme.name}</span>
                        <span class="selected-mark" aria-hidden="true">✓</span>
                    </button>
                {/each}
            </div>
        </div>

        <div class="section">
            <h3>Menu Bar Symbol</h3>
            <div class="choice-grid" role="group" aria-label="Menu bar symbol">
                <button
                    type="button"
                    class="choice-option"
                    class:active={editingSettings.traySymbol === "cactus"}
                    aria-pressed={editingSettings.traySymbol === "cactus"}
                    on:click={() => chooseTraySymbol("cactus")}
                >
                    <span class="choice-icon" aria-hidden="true">🌵</span>
                    Cactus
                </button>
                <button
                    type="button"
                    class="choice-option"
                    class:active={editingSettings.traySymbol === "heart"}
                    aria-pressed={editingSettings.traySymbol === "heart"}
                    on:click={() => chooseTraySymbol("heart")}
                >
                    <span class="choice-icon heart" aria-hidden="true">♥</span>
                    Heart
                </button>
            </div>
        </div>

        <div class="section">
            <h3>Completion Alert Font</h3>
            <div class="font-grid" role="group" aria-label="Completion alert font">
                {#each ALERT_FONTS as font}
                    <button
                        type="button"
                        class="font-option"
                        class:active={activeAlertFont === font.id}
                        aria-pressed={activeAlertFont === font.id}
                        on:click={() => chooseCompletionAlertFont(font.id)}
                    >
                        <span
                            class="font-preview"
                            style={`font-family: ${font.family}; font-weight: ${previewAlertWeight}; -webkit-text-stroke: ${previewAlertStrokeWidth}px #e34b4f`}
                            aria-hidden="true"
                        >!</span>
                        <span class="font-name">{font.name}</span>
                        <span class="selected-mark" aria-hidden="true">✓</span>
                    </button>
                {/each}
            </div>
            <div class="font-weight-control">
                <label for="completion-alert-weight">
                    Weight: {ALERT_WEIGHT_LABELS[activeAlertWeight]} ({activeAlertWeight})
                </label>
                <input
                    id="completion-alert-weight"
                    type="range"
                    min="100"
                    max="1500"
                    step="100"
                    value={activeAlertWeight}
                    on:input={updateCompletionAlertWeight}
                />
                <div class="range-extremes" aria-hidden="true">
                    <span>100 · Hairline</span>
                    <span>1500 · Maximum</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h3>Timer Settings</h3>
            <div class="field-row">
                <div class="field half">
                    <label for="work-length">Work length (minutes)</label>
                    <input
                        id="work-length"
                        type="number"
                        min="1"
                        value={editingSettings.durations.workMinutes}
                        on:change={(event) => updateDuration("workMinutes", event)}
                    />
                </div>
                <div class="field half">
                    <label for="break-length">Break length (minutes)</label>
                    <input
                        id="break-length"
                        type="number"
                        min="1"
                        value={editingSettings.durations.breakMinutes}
                        on:change={(event) => updateDuration("breakMinutes", event)}
                    />
                </div>
            </div>
        </div>

        <div class="section">
            <h3>Sound Settings</h3>
            <div class="field">
                <label for="sound-volume">Timer end sound volume: {editingSettings.soundVolume ?? 100}%</label>
                <input
                    id="sound-volume"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={editingSettings.soundVolume ?? 100}
                    on:input={updateSoundVolume}
                />
            </div>
        </div>

        <div class="controls">
            <button class="btn action secondary" on:click={openDataFolder} title="Open data folder">
                📁 Data Folder
            </button>
            <button class="btn action secondary" on:click={openGithub} title="Open GitHub repository">
                🔗 GitHub
            </button>
            <button class="btn action danger" on:click={quit}>Quit App</button>
            <button class="btn action primary" on:click={closeOptions}>Close Options</button>
        </div>
    </div>
</div>

<style>
    .options {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        overflow-y: auto;
        background: rgb(20 18 24 / 0.12);
        box-sizing: border-box;
    }

    .sheet {
        width: 100%;
        max-width: 310px;
        max-height: 100%;
        margin: auto;
        padding: 14px;
        overflow-y: auto;
        background: var(--surface);
        border: 2px solid var(--stroke);
        border-radius: 16px;
        box-shadow: 0 14px 36px rgb(34 28 39 / 0.14);
        box-sizing: border-box;
    }

    .title {
        text-align: center;
    }

    .title h2 {
        margin: 2px 0 8px;
        color: var(--ink);
    }

    .section {
        margin: 14px 0;
    }

    .section h3 {
        margin: 0 0 8px;
        color: var(--ink);
        font-size: 13px;
        font-weight: 750;
    }

    .theme-grid,
    .choice-grid,
    .font-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
    }

    .theme-option,
    .choice-option,
    .font-option {
        position: relative;
        min-width: 0;
        border: 2px solid var(--stroke);
        background: var(--surface);
        color: var(--ink);
        cursor: pointer;
        font: inherit;
        transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
    }

    .theme-option:hover,
    .choice-option:hover,
    .font-option:hover {
        border-color: color-mix(in srgb, var(--accent) 55%, var(--stroke));
        background: color-mix(in srgb, var(--surface) 94%, var(--accent));
    }

    .theme-option:focus-visible,
    .choice-option:focus-visible,
    .font-option:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--accent) 28%, transparent);
        outline-offset: 1px;
    }

    .theme-option.active,
    .choice-option.active,
    .font-option.active {
        border-color: var(--accent);
        background: color-mix(in srgb, var(--surface) 88%, var(--accent));
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 16%, transparent);
    }

    .theme-option {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 6px;
        min-height: 50px;
        padding: 8px;
        border-radius: 11px;
        text-align: left;
    }

    .theme-swatches {
        display: flex;
        align-items: center;
        padding-left: 2px;
    }

    .theme-swatches span {
        flex: 0 0 17px;
        width: 17px;
        height: 17px;
        margin-left: -4px;
        border: 2px solid var(--surface);
        border-radius: 50%;
        background: var(--theme-swatch);
        box-shadow: 0 0 0 1px rgb(30 28 31 / 0.1);
        box-sizing: border-box;
    }

    .theme-name {
        overflow: hidden;
        font-size: 10px;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .selected-mark {
        position: absolute;
        top: 4px;
        right: 4px;
        display: grid;
        width: 15px;
        height: 15px;
        place-items: center;
        border-radius: 50%;
        background: var(--accent);
        color: var(--surface);
        font-size: 9px;
        font-weight: 900;
        opacity: 0;
        transform: scale(0.75);
        transition: opacity 140ms ease, transform 140ms ease;
    }

    .theme-option.active .selected-mark,
    .font-option.active .selected-mark {
        opacity: 1;
        transform: scale(1);
    }

    .choice-option {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 42px;
        padding: 7px 9px;
        border-radius: 11px;
        font-size: 12px;
        font-weight: 700;
    }

    .choice-icon {
        font-size: 18px;
        line-height: 1;
    }

    .choice-icon.heart {
        color: var(--accent);
    }

    .font-option {
        position: relative;
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        align-items: center;
        gap: 6px;
        min-height: 43px;
        padding: 6px 8px;
        border-radius: 11px;
        text-align: left;
    }

    .font-preview {
        color: #e34b4f;
        font-size: 24px;
        font-weight: 900;
        line-height: 1;
        text-align: center;
    }

    .font-name {
        overflow: hidden;
        font-size: 10px;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .font-weight-control {
        margin-top: 10px;
    }

    .range-extremes {
        display: flex;
        justify-content: space-between;
        margin-top: 3px;
        color: var(--muted);
        font-size: 9px;
    }

    .field {
        margin: 4px 0;
    }

    .field-row {
        display: flex;
        gap: 8px;
    }

    .field.half {
        flex: 1;
        min-width: 0;
    }

    input {
        width: 100%;
        padding: 8px 10px;
        border: 2px solid var(--stroke);
        border-radius: 10px;
        background: var(--surface);
        color: var(--ink);
        box-sizing: border-box;
        font-size: 14px;
    }

    input:focus {
        border-color: var(--accent);
        outline: 3px solid color-mix(in srgb, var(--accent) 20%, transparent);
    }

    input[type="range"] {
        height: 18px;
        padding: 0;
        appearance: none;
        background: transparent;
        border: 0;
        cursor: pointer;
    }

    input[type="range"]::-webkit-slider-runnable-track {
        height: 7px;
        border: 1px solid var(--stroke);
        border-radius: 999px;
        background: var(--card);
    }

    input[type="range"]::-webkit-slider-thumb {
        width: 18px;
        height: 18px;
        margin-top: -6px;
        appearance: none;
        border: 2px solid var(--surface);
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 0 1px var(--stroke);
        cursor: pointer;
    }

    input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border: 2px solid var(--surface);
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 0 1px var(--stroke);
        cursor: pointer;
    }

    input[type="range"]::-moz-range-track {
        height: 7px;
        border: 1px solid var(--stroke);
        border-radius: 999px;
        background: var(--card);
    }

    label {
        display: block;
        margin-bottom: 4px;
        color: var(--muted);
        font-size: 12px;
    }

    .controls {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
        margin-top: 12px;
    }

    .action {
        padding: 8px 6px;
        border-width: 2px;
        font-size: 11px;
    }

    .action.secondary {
        background: var(--card);
    }

    .action.danger {
        background: color-mix(in srgb, var(--surface) 86%, #b4453d);
    }

    .action.primary {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--surface);
    }
</style>
