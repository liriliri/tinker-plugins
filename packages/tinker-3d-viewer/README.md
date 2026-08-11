# tinker-3d-viewer

A 3D model preview plugin for [TINKER](https://github.com/liriliri/tinker), powered by [Google `<model-viewer>`](https://modelviewer.dev/) and [three.js](https://threejs.org/).

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-3d-viewer/screenshot.png)

## Features

- **Multiple formats** — GLB / glTF, FBX, OBJ, STL, PLY, DAE, 3MF, and ZIP / folders
- **Drag & drop** or file / folder picker to open models
- **Auto conversion** of non-GLB sources to GLB via three.js loaders
- **Orbit view** with auto-rotate, animation playback, and camera reset
- **First-person view** with WASD movement and mouse look (click to lock pointer)
- **Persistent view mode** remembered across sessions

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-3d-viewer`.

## Usage

1. Open a model via drag & drop, or use the open button in the toolbar
2. Orbit with the mouse, or switch to first-person view from the toolbar
3. In first-person mode, click the view to lock the mouse, use **WASD** to move, and **Esc** to unlock
4. Toggle auto-rotate / animation, reset the camera, or enter fullscreen from the toolbar
