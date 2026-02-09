import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import TokenUsage from './components/TokenUsage'
import store from './store'

const App = observer(() => {
  useEffect(() => {
    // Apply dark class to root element based on theme
    if (store.isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [store.isDark])

  return <TokenUsage />
})

export default App
