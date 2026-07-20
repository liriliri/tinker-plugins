import type { AccountSettings, MailSecurity } from '../../common/types'

interface ProviderPreset {
  imapHost: string
  imapPort: number
  imapSecurity: MailSecurity
  smtpHost: string
  smtpPort: number
  smtpSecurity: MailSecurity
}

const PRESETS: Record<string, ProviderPreset> = {
  'gmail.com': {
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapSecurity: 'SSL / TLS',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecurity: 'SSL / TLS',
  },
  'googlemail.com': {
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapSecurity: 'SSL / TLS',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecurity: 'SSL / TLS',
  },
  'outlook.com': {
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapSecurity: 'SSL / TLS',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecurity: 'STARTTLS',
  },
  'hotmail.com': {
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapSecurity: 'SSL / TLS',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecurity: 'STARTTLS',
  },
  'qq.com': {
    imapHost: 'imap.qq.com',
    imapPort: 993,
    imapSecurity: 'SSL / TLS',
    smtpHost: 'smtp.qq.com',
    smtpPort: 465,
    smtpSecurity: 'SSL / TLS',
  },
  '163.com': {
    imapHost: 'imap.163.com',
    imapPort: 993,
    imapSecurity: 'SSL / TLS',
    smtpHost: 'smtp.163.com',
    smtpPort: 465,
    smtpSecurity: 'SSL / TLS',
  },
  '126.com': {
    imapHost: 'imap.126.com',
    imapPort: 993,
    imapSecurity: 'SSL / TLS',
    smtpHost: 'smtp.126.com',
    smtpPort: 465,
    smtpSecurity: 'SSL / TLS',
  },
}

export function presetForEmail(email: string): Partial<AccountSettings> | null {
  const at = email.lastIndexOf('@')
  if (at < 0) return null
  const domain = email.slice(at + 1).toLowerCase()
  if (!domain) return null
  const preset = PRESETS[domain]
  if (!preset) {
    return {
      imapHost: `imap.${domain}`,
      imapPort: 993,
      imapSecurity: 'SSL / TLS',
      smtpHost: `smtp.${domain}`,
      smtpPort: 465,
      smtpSecurity: 'SSL / TLS',
    }
  }
  return { ...preset }
}
