# tinker-emoji

An emoji picker plugin for [TINKER](https://github.com/liriliri/tinker).

![Screenshot](screenshot.png)

## Features

- **1700+ Emojis** - Complete emoji collection with categories
- **Search** - Search emojis by name, description, or keywords (supports Chinese and English)
- **Categories** - Browse emojis by category (Smileys, People, Animals, Food, etc.)
- **Recent & Favorites** - Quick access to frequently used and favorite emojis
- **Click to Copy** - Simple click to copy emoji to clipboard
- **Dark Mode** - Automatic dark mode support
- **Bilingual** - Full support for English and Chinese

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run:

```bash
npm i -g tinker-emoji
```

## Usage

1. **Browse Categories** - Click on category tabs to filter emojis
2. **Search** - Type in the search bar to find emojis by name or keyword
3. **Copy** - Click on any emoji to copy it to clipboard
4. **Favorite** - Hover over an emoji and click the star icon to add to favorites
5. **Recent** - View your recently used emojis in the "Recent" tab

## Development

### Setup

```bash
npm install
```

### Process Emoji Data

If you need to re-process the emoji data from the reference files:

```bash
npm run process-data
```

This will:
- Read emoji data from `references/utools_emojis-main/json/`
- Merge and process the data
- Generate `src/data/emojis.json` and `src/data/categories.json`

### Run Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Data Sources

The emoji data is sourced from [utools_emojis](https://github.com/uTools-Labs/utools_emojis), which provides:
- Complete emoji collection with shortcodes
- Chinese and English descriptions
- Keywords for searching
- Category information

## License

MIT
