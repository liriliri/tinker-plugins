import renderApp from 'tinker-share/lib/renderApp'
import App from './App'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

renderApp(App, {
  'en-US': enUS,
  'zh-CN': zhCN,
})
