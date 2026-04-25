import App from './App'
import { createRoot } from 'react-dom/client'
import './index.scss'
import i18n from './i18n'
import store from './store'

function renderApp() {
  const container: HTMLElement = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
}

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)
  store.setLanguage(language)

  renderApp()
})()
