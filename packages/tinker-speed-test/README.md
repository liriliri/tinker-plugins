# tinker-speed-test

A network speed test plugin for [TINKER](https://github.com/liriliri/tinker), measuring latency, download, and upload against selectable test nodes.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-speed-test/screenshot.png)

## Features

- **Latency & jitter** probe with live median readout
- **Multi-stream download / upload** throughput test (Mbps or MB/s)
- **Multiple nodes** — Shanghai Telecom (Ookla), Singapore Singtel (Ookla), Cloudflare
- **Live meter** with LCD-style readout, sparkline, and horizontal scale
- **Public IP** shown in the toolbar during the test

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-speed-test`.

## Usage

1. Open the plugin and pick a test node and unit (Mbps / MB/s)
2. Click **Start** to run IP → latency → download → upload in sequence
3. Watch the live readout and sparkline; results appear in the metric rail below
4. Click **Stop** anytime to cancel the current run
