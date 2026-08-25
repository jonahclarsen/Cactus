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
- Choose a cactus or heart-shaped menu bar progress symbol and completion-alert font
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

Use the `+` and `-` buttons with modifiers:
- **Normal click**: ±1 minute
- **Cmd/Ctrl + click**: ±5 minutes

### Configuration

Press `o` or click "Options" to access settings:
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
