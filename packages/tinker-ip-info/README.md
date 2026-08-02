# tinker-ip-info

An IP info plugin for [TINKER](https://github.com/liriliri/tinker), showing LAN/public IP addresses, website latency, and DNS exits.

![Screenshot](https://raw.githubusercontent.com/liriliri/tinker-plugins/master/packages/tinker-ip-info/screenshot.png)

## Features

- **LAN IPv4** listed by network interface, with the preferred adapter first
- **Domestic & overseas public IP** lookup with location and ISP (multi-source fallback)
- **Latency test** against common sites (domestic for zh-CN, overseas otherwise)
- **DNS exit** detection with geo info
- **One-click copy** for IP addresses

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-ip-info`.

## Usage

1. Open the plugin to view LAN IPs, public IPs, latency, and DNS exits
2. Click an IP address (or its copy button) to copy it to the clipboard
3. Click "Refresh" to re-query all data
