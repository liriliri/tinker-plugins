# tinker-voice-clone

A local voice cloning plugin for [TINKER](https://github.com/liriliri/tinker), powered by [audio.cpp](https://github.com/0xShug0/audio.cpp) via `audiocpp-static`.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-voice-clone/screenshot.png)

## Features

- **Local voice clone** with IndexTTS / VoxCPM2 / OmniVoice / Qwen3-TTS GGUF models
- **Reference audio** with default sample, or voice design text for supported models
- **Auto model download** via Downloader into `~/.tinker/models/` when missing
- **Generation queue** with WaveSurfer preview, play, and save as WAV
- **Local inference** backends: Metal / CPU / CUDA / Vulkan

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-voice-clone`.

## Usage

1. Select a model, language, and backend in the options panel
2. Keep the default sample or pick a short reference WAV (1–60s works best)
3. Enter text and click **Generate** — missing models start downloading automatically
4. Preview queued results in the audio list; save WAV when ready

Runtime data lives in `~/.tinker/tinker-voice-clone/` (logs / outputs). Models are shared under `~/.tinker/models/`.
