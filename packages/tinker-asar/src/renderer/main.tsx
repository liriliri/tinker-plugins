import renderApp from 'tinker-share/lib/renderApp'
import AsarViewer from './components/AsarViewer'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './monaco'
import './index.scss'

renderApp(AsarViewer, { 'en-US': enUS, 'zh-CN': zhCN })
