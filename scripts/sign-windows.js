// electron-builder custom sign hook (win.signtoolOptions.sign).
// Release CI decodes the WINDOWS_SIGN_SCRIPT secret to a temp .ps1 and exposes
// its path as WINDOWS_SIGN_SCRIPT_PATH; without it (local or non-release builds)
// signing is skipped.
const { execFileSync } = require("child_process");
const path = require("path");

module.exports = async function sign(configuration) {
    const file = configuration.path;
    const script = process.env.WINDOWS_SIGN_SCRIPT_PATH;
    if (!script) {
        console.log(`Windows signing skipped (no WINDOWS_SIGN_SCRIPT_PATH): ${file}`);
        return;
    }
    // Sign only what we build: Cactus.exe, the NSIS uninstaller and installer.
    // Skip electron-builder's bundled elevate.exe and any third-party binaries
    // unpacked from node_modules.
    if (path.basename(file).toLowerCase() === "elevate.exe" || file.includes("app.asar.unpacked")) {
        console.log(`Windows signing skipped (third-party): ${file}`);
        return;
    }
    execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, file], { stdio: "inherit" });
};
