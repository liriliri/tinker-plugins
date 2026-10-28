# tinker-asar

Browse, edit, and extract Electron `.asar` archives. A plugin for [TINKER](https://github.com/liriliri/tinker).

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-asar/screenshot.png)

## Features

- **Browse archives** — open or drop a `.asar` file and explore the tree
- **Preview & edit** text files in a Monaco editor; save changes back into the archive
- **Create & delete** files or folders from the context menu
- **Extract** the whole package or selected paths to a folder
- **Unpacked markers** — files living outside the asar (`.asar.unpacked`) are labeled
- **MCP tools** `open`, `list_files`, and `extract` for agent / CLI automation

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-asar`.

## Usage

1. Click **Open** (or drag in a `.asar` file)
2. Browse the file tree on the left; preview and edit text on the right
3. Right-click a file or folder to extract, create, or delete
4. Use **Extract All** to unpack the whole archive, or **Save** to write edits back
