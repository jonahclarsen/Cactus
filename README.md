# Cactus

A super simple tray application with a Pomodoro-style timer for focused work sessions and breaks.

I created this app because I couldn't find a Pomodoro solution I really liked - I wanted something minimal, beautiful, and that lives in the system tray.

## ✨ Features

### ⏱️ Pomodoro Timer
- Customizable work sessions (default: 30 minutes)
- Break timer support (default: 3 minutes)  
- Visual countdown with progress pie chart in system tray
- Audio notification when timer ends
- Quick time extensions with keyboard modifiers
- Lives in the system tray/menu bar

### ⚙️ Customization
- Choose from multiple color themes
- Choose a cactus or heart-shaped menu bar progress symbol and customize the completion alert
- Adjust work and break durations
- Keyboard shortcuts (press 'o' for options)

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- pnpm

### Quick Start

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run in development mode**
   ```bash
   pnpm run dev
   ```

4. **Build for production**
   ```bash
   pnpm run build
   ```

## 🎮 Usage

### Basic Operations

- **Start Work Timer**: Click "🍅 Start Pomodoro" to begin a work session
- **Take a Break**: Click "🌿 Start Break" to start a break timer
- **Pause/Resume**: Click the timer link to pause or resume
- **Stop Timer**: The timer stops automatically when it reaches zero

### Time Extensions

Global shortcuts work while Cactus is running, even when its window is hidden:
- **Alt+Shift+Q**: Remove 1 minute from the timer
- **Alt+Shift+W**: Add 1 minute to the timer
- **Alt+Shift+A**: Remove 5 minutes from the timer
- **Alt+Shift+S**: Add 5 minutes to the timer
- **Alt+Shift+Z**: Start a Pomodoro unless a work session already has time left
- **Right-click the menu bar icon**: Same action as starting a Pomodoro
- **Alt+Shift+X**: Show or hide the UI (Option+Shift+X on macOS)

On macOS, Alt is Option. Customize any shortcut in Options → Keyboard Shortcuts
by typing a combination such as `Option+Shift+Q`, then pressing Tab or clicking away.
Changes apply immediately and are saved across restarts. Leave a field blank to
disable that shortcut. Invalid or unavailable combinations keep the previous settings.

Use the `+` and `-` buttons with modifiers:
- **Normal click**: ±1 minute
- **Cmd/Ctrl + click**: ±5 minutes

### Configuration

Press `o` or click "Options" to access settings:
- Enable Launch at login on macOS (release app only)
- Select color theme
- Select a cactus or heart menu bar symbol
- Set work/break durations
- Open data folder

## 🏗️ Technical Details

### Built With
- **Electron** - Cross-platform desktop framework
- **Svelte** - Reactive frontend framework
- **Vite** - Fast build tool and dev server
- **Node.js** - Backend runtime

## 📊 Data Storage

Cactus stores your data in a JSON file:
- **macOS**: `~/Library/Application Support/cactus/cactus.json`
- **Windows**: `%APPDATA%/cactus/cactus.json`
- **Linux**: `~/.config/cactus/cactus.json`

The data includes:
- Timer state and settings
- User preferences (theme, durations)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Balance Situate

When Balance publishes a night pass to `~/.local/share/balance-situate/status.json`,
Cactus shows its remaining time. It reads only this Situate status file; it cannot
read planner data, extend a pass, or turn a mode off. The normal timer continues
underneath and returns when the pass ends. Missing or stale status restores the
normal timer. No shell hook or network service is needed.
