# tinker-n64

A N64 emulator plugin for [TINKER](https://github.com/liriliri/tinker), supporting ROM loading with keyboard and gamepad controls, save states, and fullscreen playback.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-n64/screenshot.png)

## Features

- **N64 Emulation** powered by N64Wasm (Mupen64Plus)
- **ROM Loading** via file picker, drag and drop, or click the empty viewport (`.n64` / `.v64` / `.z64`)
- **Reset** support
- **Save / Load State** support
- **Mute / Unmute** audio toggle
- **Fullscreen** mode
- **Custom Key Mapping** for keyboard and gamepad, including analog stick axes
- **Play History** sidebar with ROM search
- **Dark Mode** support

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-n64`.

## Usage

1. Click **OPEN ROM** to load a `.n64`, `.v64`, or `.z64` file, drag and drop it onto the screen, or click the empty viewport
2. Use keyboard or gamepad to play
3. Click **RESET** to restart the current ROM
4. Click **SAVE STATE** / **LOAD STATE** to save or restore progress
5. Click **MUTE** / **UNMUTE** to toggle audio
6. Click **FULLSCREEN** to enter fullscreen mode
7. Click **KEY BINDINGS** to customize keyboard and gamepad mappings
8. Toggle the **SIDEBAR** to browse play history or search for ROMs on disk
