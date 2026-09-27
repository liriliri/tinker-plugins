import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  external: ['imapflow', 'mailparser', 'nodemailer'],
})
