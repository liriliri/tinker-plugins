# tinker-avd

An Android Virtual Device manager plugin for [TINKER](https://github.com/liriliri/tinker), for listing, starting, and stopping local AVDs.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-avd/screenshot.png)

## Features

- **List AVDs** with resolution, SDK, ABI, memory, storage, and running status
- **Start / Stop** emulators from the toolbar or by double-clicking a row
- **Wipe Data** to clear snapshots and userdata
- **Open Directory** to reveal the AVD folder in Finder / Explorer
- **MCP Tools** for `list_avds`, `start_avd`, and `stop_avd` via the CLI

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-avd`.

## Requirements

Android SDK Emulator must be installed. AVDs are read from `ANDROID_AVD_HOME` or `~/.android/avd`. The emulator binary is resolved from `ANDROID_HOME` / `ANDROID_SDK_ROOT`.

## Usage

1. Browse local AVDs in the table
2. Select a device, then click Start or Stop
3. Double-click a stopped AVD to start it
4. Use Wipe Data or Open Directory as needed
5. Filter the list by name, ABI, or API level
