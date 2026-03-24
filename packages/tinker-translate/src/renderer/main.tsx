import { createRoot } from 'react-dom/client'
import App from './App'
import './index.scss'
import i18n from './i18n'
import store from './store'

function renderApp() {
  const container = document.getElementById('app')
  if (container) {
    const root = createRoot(container)
    root.render(<App />)
  }
}

;(async function () {
  const [language] = await Promise.all([tinker.getLanguage(), store.init()])
  i18n.changeLanguage(language)

  renderApp()
})()
