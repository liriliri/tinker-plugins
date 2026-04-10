import App from './App'
import { createRoot } from 'react-dom/client'
import './index.scss'
import i18n from './i18n'

tinker.getTheme().then((theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
})

tinker.on('changeTheme', (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
})
;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container: HTMLElement = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
