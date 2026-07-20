import fs from 'node:fs/promises'
import path from 'node:path'
import isArr from 'licia/isArr'
import type { Account } from '../common/types'

const ACCOUNTS_FILE = 'accounts.json'

async function getAccountsPath(): Promise<string> {
  const userData = await tinker.getPath('userData')
  const dir = path.join(userData, 'tinker-mailbox')
  await fs.mkdir(dir, { recursive: true })
  return path.join(dir, ACCOUNTS_FILE)
}

export async function loadAccounts(): Promise<Account[]> {
  try {
    const filePath = await getAccountsPath()
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Account[]
    return isArr(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveAccounts(accounts: Account[]): Promise<void> {
  const filePath = await getAccountsPath()
  await fs.writeFile(filePath, JSON.stringify(accounts, null, 2), 'utf-8')
}
