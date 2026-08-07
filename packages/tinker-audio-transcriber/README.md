# tinker-audio-transcriber

An audio transcription plugin for [TINKER](https://github.com/liriliri/tinker), powered by [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx).

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-audio-transcriber/screenshot.png)

## Features

- **Local ASR** with SenseVoice and Whisper models (no cloud dependency)
- **Long media support** for audio and video files via FFmpeg
- **Speech segmentation** with Silero VAD and timed cue list
- **Drag & drop** or file picker to open media
- **Copy or save** plain text and SRT subtitles
- **Cancelable** transcription with live progress

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-audio-transcriber`.

## Usage

1. Select an ASR model (SenseVoice or Whisper); download model files if prompted
2. Open a media file via drag & drop or the open button
3. Wait for recognition to finish (progress shows preparing, VAD, and recognizing stages)
4. Copy or save the transcript text and SRT cues from the result panels
