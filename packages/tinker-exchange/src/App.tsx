import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { tw } from './theme'
import CurrencyInput from './components/CurrencyInput'
import CurrencyList from './components/CurrencyList'
import CurrencyAdd from './components/CurrencyAdd'

const App = observer(() => {
  return (
    <div
      className={className(
        'h-screen flex flex-col p-3 gap-2',
        tw.background.primary,
        tw.text.primary,
      )}
    >
      <CurrencyInput />
      <div className="flex-1 min-h-0 overflow-auto">
        <CurrencyList />
      </div>
      <CurrencyAdd />
    </div>
  )
})

export default App
