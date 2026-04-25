import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import store from './store'
import { tw } from './theme'
import TextDisplay from './components/TextDisplay'
import StatsDisplay from './components/StatsDisplay'
import ResultsCard from './components/ResultsCard'

const App = observer(() => {
  const { status } = store

  return (
    <div
      className={className(
        'h-screen flex flex-col items-center justify-center px-6',
        tw.background.primary,
      )}
    >
      {status === 'finished' ? (
        <ResultsCard />
      ) : (
        <div className="w-full max-w-4xl flex flex-col gap-14">
          <StatsDisplay />
          <TextDisplay />
        </div>
      )}
    </div>
  )
})

export default App
