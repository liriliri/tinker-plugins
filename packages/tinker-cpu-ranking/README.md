# tinker-cpu-ranking

A CPU performance ranking plugin for [TINKER](https://github.com/liriliri/tinker), browsing desktop and laptop Cinebench R23 ladders.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-cpu-ranking/screenshot.png)

## Features

- **Desktop & Laptop** rankings switched from the toolbar
- **Brand Filter** for Intel, AMD, Apple, and Qualcomm
- **Search** CPUs by name, process, or core count
- **Sortable Columns** for multi-core, single-core, and rank
- **Local Cache** with cooldown-guarded refresh

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-cpu-ranking`.

## Usage

1. Open the plugin to load cached rankings, or wait for the first fetch
2. Switch Desktop / Laptop and optionally filter by brand
3. Type in the search box to narrow the list
4. Click a column header to sort by rank, multi-core, or single-core
5. Click a row to clear filters and jump to its rank position
6. Click the refresh button to update data (once per hour)

## Data Source

Powered by [TopCPU](https://www.topcpu.net/) Cinebench R23 rankings. Data is for reference only.
