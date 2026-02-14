import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.scss'
import './i18n'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
