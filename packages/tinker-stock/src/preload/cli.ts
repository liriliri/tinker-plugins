import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import path from 'node:path'
import contain from 'licia/contain'
import trim from 'licia/trim'

const require = createRequire(__filename)

function resolveCliPath(): string {
  try {
    return require.resolve('westock-data-clawhub/scripts/index.js')
  } catch {
    const candidates = [
      path.join(
        __dirname,
        '../../node_modules/westock-data-clawhub/scripts/index.js',
      ),
      path.join(
        __dirname,
        '../../../node_modules/westock-data-clawhub/scripts/index.js',
      ),
      path.join(
        __dirname,
        '../../../../node_modules/westock-data-clawhub/scripts/index.js',
      ),
    ]
    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate
    }
    throw new Error('westock-data-clawhub is not installed')
  }
}

export async function runWestock(args: string[]): Promise<string> {
  const cliPath = resolveCliPath()
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
      },
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      const output = trim(stdout)
      if (code !== 0 && !output) {
        reject(new Error(trim(stderr) || `westock exited with code ${code}`))
        return
      }
      if (
        contain(output, '在当前渠道不可用') ||
        contain(output, '股票查询工具 - 命令行接口')
      ) {
        reject(new Error(trim(stderr) || output.slice(0, 200)))
        return
      }
      resolve(output)
    })
  })
}
