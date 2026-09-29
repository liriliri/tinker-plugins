import { observer } from 'mobx-react-lite'
import store from '../store'
import { tw } from '../theme'

interface KeycapProps {
  label: string
}

const Keycap = observer(function Keycap({ label }: KeycapProps) {
  return (
    <kbd className={tw.keycap} style={store.keycapStyle}>
      {label}
    </kbd>
  )
})

export default Keycap
