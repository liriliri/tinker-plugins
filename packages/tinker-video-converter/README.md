# tinker-video-converter

A video format converter plugin for [TINKER](https://github.com/liriliri/tinker), powered by FFmpeg.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-video-converter/screenshot.png)

## Features

- **Multiple containers** (MP4, MKV, WebM, AVI, MOV, GIF, etc.)
- **Video encoders** (H.264, H.265, VP9, AV1, ProRes, Xvid)
- **Quality control** with CRF or average bitrate modes
- **Encoder tuning** with preset, tune, profile, and level options
- **Picture settings** for resolution and framerate adjustment
- **Video filters** including deinterlace, denoise, and sharpen
- **Audio encoding** with codec, bitrate, sample rate, and mixdown options
- **Batch queue** for converting multiple files sequentially
- **FFmpeg command preview** to inspect and copy the generated command
- **Global presets** for quick configuration
- **i18n** support for English and Chinese

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-video-converter`.

## Usage

1. Open a video file via drag & drop or the open button
2. Configure output format, encoder, quality, and other settings
3. Click **Start** to begin conversion, or **Add to Queue** for batch processing
4. Monitor progress and open the output file when done
