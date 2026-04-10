import { createRoot } from 'react-dom/client'
import App from './App'
import './index.scss'
import i18n from './i18n'

tinker.getLanguage().then((language) => {
  i18n.changeLanguage(language)

  const container = document.getElementById('app')
  if (container) {
    createRoot(container).render(<App />)
  }
})
