# tinker-gltf-optimizer

A GLB/GLTF optimizer plugin for [TINKER](https://github.com/liriliri/tinker).

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-gltf-optimizer/screenshot.png)

## Features

- Batch open or drop `.glb` / `.gltf` models
- Quality presets for mesh simplify and texture resize
- Draco + WebP optimization via [gltf-optimizer](https://github.com/juunini/gltf-optimizer)
- Compare original vs output size
- MCP tool `optimize` for agent / CLI automation

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-gltf-optimizer`.

## Usage

1. Drop or open GLB/GLTF files
2. Choose a quality preset
3. Optionally set an output directory
4. Click Optimize
