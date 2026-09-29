# tinker-gpu-ranking

A GPU performance ranking plugin for [TINKER](https://github.com/liriliri/tinker), browsing desktop and laptop FP32 ladders.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-gpu-ranking/screenshot.png)

## Features

- **Desktop & Laptop** rankings switched from the toolbar
- **Brand Filter** for Nvidia, AMD, Intel, Apple, and Qualcomm
- **Search** GPUs by name or VRAM
- **Sortable Columns** for TFLOPS, rating, and rank
- **Local Cache** with cooldown-guarded refresh

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-gpu-ranking`.

## Usage

1. Open the plugin to load cached rankings, or wait for the first fetch
2. Switch Desktop / Laptop and optionally filter by brand
3. Type in the search box to narrow the list
4. Click a column header to sort by rank, TFLOPS, or rating
5. Click a row to clear filters and jump to its rank position
6. Click the refresh button to update data (once per hour)

## Data Source

Powered by [TopCPU](https://www.topcpu.net/) GPU FP32 rankings. Data is for reference only.
