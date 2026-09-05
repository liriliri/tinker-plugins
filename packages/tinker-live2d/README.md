# tinker-live2d

A Live2D desktop pet plugin for [TINKER](https://github.com/liriliri/tinker). Import local Cubism 2 / 3–4 models and run them as always-on-top companions.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-live2d/screenshot.png)

## Features

- **Local models** — Cubism 2 (`model.json` / `index.json`) and Cubism 3–4 (`.model3.json`), via drag & drop or file picker
- **Preview & name** — confirm each import with a live preview and editable display name
- **Desktop pet** — transparent always-on-top window; drag to move; scale and opacity in Settings
- **Gaze tracking** — looks toward the cursor; resets when the pointer leaves

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-live2d`.

## Usage

1. Drop a model folder (or entry `.json`) onto the window, or click **Add model**
2. Preview the model, optionally edit the name, then click **Add**
3. Click **Enable** on a card to show the pet on the desktop
4. Drag the pet to move it; adjust size, opacity, and always-on-top in Settings

Models are stored under `~/.tinker/tinker-live2d/models/`.
