import { RelayServer } from './relayServer'
import { DEFAULT_RELAY_PORT } from '../common/types'
import { DEFAULT_MAX_PORTS } from './portPolicy'
import some from 'licia/some'
import trim from 'licia/trim'
import isInt from 'licia/isInt'

function printHelp() {
  console.log(`Usage:
  tinker-tcp-tunnel serve [options]

Options:
  -p, --port <port>       Control port (default: ${DEFAULT_RELAY_PORT})
  -t, --token <token>     Auth token (required)
      --max-ports <n>     Max mapped ports per client (default: ${DEFAULT_MAX_PORTS})
      --allow-sensitive   Allow privileged / sensitive remote ports
      --proxy-bind <ip>   Bind address for mapped ports (default: 0.0.0.0)
  -h, --help              Show help

Notes:
  - Token is required.
  - Control port binds to 0.0.0.0. Open it in the firewall so the client can connect.
  - By default, ports < 1024 and common sensitive ports (22, 3306, 3389, …)
    cannot be mapped. Use --allow-sensitive to override.
  - Control port itself cannot be mapped.

Example:
  tinker-tcp-tunnel serve -p 7700 -t my-secret
  # Plugin relay host = the server's public IP, port = 7700
`)
}

function readArg(
  args: string[],
  name: string,
  short?: string,
): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === name || (short && a === short)) {
      return args[i + 1]
    }
    if (a.startsWith(`${name}=`)) return a.slice(name.length + 1)
    if (short && a.startsWith(`${short}=`)) return a.slice(short.length + 1)
  }
  return undefined
}

function hasFlag(args: string[], ...flags: string[]) {
  return some(flags, (f) => args.includes(f))
}

async function main() {
  const argv = process.argv.slice(2)
  const cmd = argv[0]

  if (
    !cmd ||
    cmd === '-h' ||
    cmd === '--help' ||
    hasFlag(argv, '-h', '--help')
  ) {
    printHelp()
    process.exit(0)
  }

  if (cmd !== 'serve') {
    console.error(`Unknown command: ${cmd}`)
    printHelp()
    process.exit(1)
  }

  const args = argv.slice(1)
  if (hasFlag(args, '-h', '--help')) {
    printHelp()
    process.exit(0)
  }

  const portRaw = readArg(args, '--port', '-p')
  const token = trim(readArg(args, '--token', '-t') || '')
  const maxPortsRaw = readArg(args, '--max-ports')
  const proxyBind = readArg(args, '--proxy-bind') || '0.0.0.0'
  const allowSensitive = hasFlag(args, '--allow-sensitive')
  const port = portRaw ? Number(portRaw) : DEFAULT_RELAY_PORT
  const maxPorts = maxPortsRaw ? Number(maxPortsRaw) : DEFAULT_MAX_PORTS

  if (!token) {
    console.error('Error: --token is required')
    process.exit(1)
  }

  if (!isInt(port) || port <= 0 || port >= 65536) {
    console.error('Invalid port')
    process.exit(1)
  }

  if (!isInt(maxPorts) || maxPorts <= 0 || maxPorts > 1000) {
    console.error('Invalid --max-ports (use 1–1000)')
    process.exit(1)
  }

  const server = new RelayServer({
    proxyHost: proxyBind,
    port,
    token,
    maxPorts,
    allowSensitive,
    onLog: (message) => {
      const time = new Date().toISOString()
      console.log(`[${time}] ${message}`)
    },
  })

  const shutdown = async () => {
    console.log('shutting down...')
    await server.stop()
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown())
  process.on('SIGTERM', () => void shutdown())

  try {
    await server.start()
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

void main()
