# tinker-video-downloader

A multi-site video downloader plugin for [TINKER](https://github.com/liriliri/tinker), powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp).

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-video-downloader/screenshot.png)

## Features

- **Multi-site download** for any URL supported by yt-dlp (YouTube, Bilibili, and many more)
- **Quality selection** before download from available formats
- **Download progress** with task list, including merge status
- **Cookies** via manual entries or `cookies.txt` import (helpful for login-required videos)
- **Custom yt-dlp path** when the binary is not on `PATH`

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-video-downloader`.

## Requirements

- Install [yt-dlp](https://github.com/yt-dlp/yt-dlp#installation) and ensure it is on your `PATH`, or set a custom path in Settings.
- FFmpeg is used via Tinker to merge separate video/audio streams when needed.

## Usage

1. Paste a video URL and click **Parse**
2. Select a format and click **Download**
3. Monitor progress in the task list; open the output folder when done
4. Use **Cookies** for sites that need login, and **Settings** for download directory / yt-dlp path
