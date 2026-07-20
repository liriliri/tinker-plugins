import nodemailer from 'nodemailer'
import type { AccountSettings } from '../../common/types'

export function imapOptions(settings: AccountSettings) {
  const secure = settings.imapSecurity === 'SSL / TLS'
  return {
    host: settings.imapHost,
    port: settings.imapPort,
    secure,
    doSTARTTLS:
      settings.imapSecurity === 'STARTTLS'
        ? true
        : settings.imapSecurity === 'none'
          ? false
          : undefined,
    tls: {
      rejectUnauthorized: !settings.imapAllowInsecureSsl,
    },
    auth: {
      user: settings.imapUsername,
      pass: settings.imapPassword,
    },
    logger: false as const,
  }
}

export function smtpTransport(settings: AccountSettings) {
  const secure = settings.smtpSecurity === 'SSL / TLS'
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure,
    requireTLS: settings.smtpSecurity === 'STARTTLS',
    tls: {
      rejectUnauthorized: !settings.smtpAllowInsecureSsl,
    },
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
  })
}
