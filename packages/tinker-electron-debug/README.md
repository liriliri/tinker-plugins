# tinker-electron-debug

An Electron app debugger plugin for [TINKER](https://github.com/liriliri/tinker), enabling remote debugging of in-production Electron applications.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-electron-debug/screenshot.png)

## Features

- **Auto-detect** Electron apps installed on the system
- **Launch & attach** debugger with a single click
- **Inspect pages** — view Node.js and renderer process targets
- **DevTools integration** — open Chrome DevTools for any target
- **Live log output** — stream stdout/stderr in a builtin terminal
- **Multi-session** support for debugging multiple apps simultaneously

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-electron-debug`.

## Usage

1. Select an Electron app from the app grid
2. The app launches with debugging ports enabled
3. Inspect Node.js or renderer process targets in the page list
4. Click **Inspect** to open Chrome DevTools for a target
5. View live log output in the terminal below
