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
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)
  store.init()
  renderApp()
})()
