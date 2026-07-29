# tinker-svg-editor

An SVG editor plugin for [TINKER](https://github.com/liriliri/tinker), powered by [`@svgedit/svgcanvas`](https://www.npmjs.com/package/@svgedit/svgcanvas).

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-svg-editor/screenshot.png)

## Features

- **Drawing tools** — select, pan, pencil, line, rectangle, ellipse, path, text, and zoom
- **Fill & stroke** with color chips, swap, and a bottom palette
- **Canvas size** editing from the toolbar
- **Element editing** for stroke width, rectangle roundness, and text style
- **Arrange** via context menu — align, bring forward / send backward, group / ungroup
- **Undo / redo** and cut / copy / paste / duplicate
- **Open & save** SVG files, **export PNG**, and edit raw SVG source

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-svg-editor`.

## Usage

1. Use the left toolbar to pick a drawing tool, or press shortcuts such as `V` (select), `H` (pan), `R` (rect), `O` (ellipse)
2. Click the fill / stroke chips or the palette to set colors (Shift-click a palette swatch for stroke)
3. Click the canvas size label in the toolbar to resize the document
4. Right-click selected elements to align, reorder, group, or ungroup
5. Use **Open** / **Save** for SVG files, **Export PNG** for a raster copy, or **Source** to edit the SVG markup
