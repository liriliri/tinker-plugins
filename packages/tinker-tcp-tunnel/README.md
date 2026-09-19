# tinker-tcp-tunnel

A TCP tunnel plugin for [TINKER](https://github.com/liriliri/tinker), for temporarily exposing local TCP ports through a public relay.

## Features

- **Host list** with per-host connect / disconnect and independent status
- **Port mappings** as separate cards (remote port → local host:port)
- **Relay CLI** (`tinker-tcp-tunnel serve`) packaged in the same npm package
- **Required token** auth on the server
- **Safe defaults**: control port on `127.0.0.1` only, sensitive ports blocked, max 10 mappings per client

## Installation

Download and install TINKER from `https://tinker.liriliri.io/`, then run `npm i -g tinker-tcp-tunnel`.

## Usage

### Plugin (client)

1. Open **TCP Tunnel** in Tinker
2. Add a relay host (address, control port, token)
3. Add port mappings for that host
4. Click **Connect**

Config is stored at `~/.tinker-tcp-tunnel/config.json`.

### Server (relay)

The relay must run on a machine with a public IP (for example a VPS). The control port always binds to **`127.0.0.1`** and is not exposed on the public NIC; mapped ports bind to `0.0.0.0` by default.

On the VPS:

```bash
tinker-tcp-tunnel serve -p 7700 -t my-secret
```

`--token` is **required**. Defaults:

- Control listen: `127.0.0.1` only
- Mapped ports: `0.0.0.0` (change with `--proxy-bind`)
- Block privileged ports (`< 1024`) and common sensitive ports (MySQL, RDP, Redis, …)
- At most **10** mapped ports per client
- Control port itself cannot be mapped

Reach the control port from your laptop via SSH local forward:

```bash
ssh -L 7700:127.0.0.1:7700 user@vps
```

Then in the plugin set relay host to `127.0.0.1`, port `7700`, and the same token. Open the **mapped** remote ports in the VPS firewall; you do not need to expose the control port publicly.

Optional flags:

```bash
tinker-tcp-tunnel serve -p 7700 -t my-secret --max-ports 20
tinker-tcp-tunnel serve -p 7700 -t my-secret --allow-sensitive
tinker-tcp-tunnel serve -p 7700 -t my-secret --proxy-bind 0.0.0.0
```

```bash
tinker-tcp-tunnel serve --help
```

Intended for **temporary** access to local services, not long-running public exposure.
