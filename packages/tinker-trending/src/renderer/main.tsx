import { createRoot } from 'react-dom/client'
import App from './App'
import './index.scss'
import i18n from './i18n'

tinker.getTheme().then((theme) => {
  if (theme === 'dark') document.documentElement.classList.add('dark')
})

tinker.on('changeTheme', (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
})

tinker.getLanguage().then((language) => {
  i18n.changeLanguage(language)

  const container = document.getElementById('app')
  if (container) {
    createRoot(container).render(<App />)
  }
})
