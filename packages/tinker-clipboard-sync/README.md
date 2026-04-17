# tinker-clipboard-sync

A clipboard sync plugin for [TINKER](https://github.com/liriliri/tinker), enabling clipboard sharing between host and VM via shared files.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-clipboard-sync/screenshot.png)

## Features

- **Bidirectional sync** clipboard content between host and VM through a shared JSON file
- **File-based** approach works reliably across different VM environments (UTM, Parallels, etc.)
- **Real-time polling** detects clipboard and file changes automatically
- **Auto sync** option to start syncing on plugin launch
- **i18n** support for English and Chinese

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-clipboard-sync`.

## Usage

1. Enter or browse to select a shared file path accessible by both host and VM
2. Click "Start Sync" to begin clipboard synchronization
3. Copy text on either side — it will automatically appear on the other
4. Optionally enable "Auto sync on startup" for automatic syncing
