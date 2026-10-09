#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const htmlPath = path.resolve(
  process.argv[2] || path.join(process.cwd(), 'dist/index.html'),
)
const id = process.argv[3] || 'G-PSDF66BGWZ'

const ga = [
  `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`,
  '<script>',
  'window.dataLayer = window.dataLayer || [];',
  'function gtag(){dataLayer.push(arguments);}',
  "gtag('js', new Date());",
  `gtag('config', '${id}');`,
  '</script>',
].join('\n')

const html = fs.readFileSync(htmlPath, 'utf8')
if (!html.includes('</head>')) {
  throw new Error(`${htmlPath} missing </head>`)
}

fs.writeFileSync(htmlPath, html.replace('</head>', `${ga}\n</head>`))
console.log(`Injected GA (${id}) into ${htmlPath}`)
