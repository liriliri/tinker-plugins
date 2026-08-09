# tinker-tts

A text-to-speech plugin for [TINKER](https://github.com/liriliri/tinker), powered by Microsoft Edge online TTS.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-tts/screenshot.png)

## Features

- **Edge neural voices** with multi-language selection (no local model download)
- **Rate / pitch / volume** controls for prosody
- **Long text** support via automatic chunked synthesis
- **Paste, clear, and character count** in the text panel
- **Play or save** generated MP3 (auto-plays after generate)
- **Cancelable** synthesis with multi-chunk progress

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-tts`.

## Usage

1. Select language and voice in the options panel
2. Enter or paste text; adjust rate / pitch / volume if needed
3. Click **Generate** and wait for synthesis to finish
4. Use the bottom player to play, seek, or save the MP3

Requires network access to Microsoft Edge TTS.
