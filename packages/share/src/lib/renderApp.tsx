import { createRoot } from 'react-dom/client'
import { initI18n, type Locales } from './i18n'

export default async function renderApp(
  App: React.ComponentType,
  locales: Locales,
) {
  await initI18n(locales)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
}
