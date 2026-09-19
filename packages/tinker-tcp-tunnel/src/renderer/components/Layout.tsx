import className from 'licia/className'
import HostSidebar from './HostSidebar'
import HostDialog from './HostDialog'
import Toolbar from './Toolbar'
import MappingsPanel from './MappingsPanel'
import { tw } from '../theme'

export default function Layout() {
  return (
    <div className={className('flex min-h-0 flex-1', tw.background.app)}>
      <HostSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Toolbar />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MappingsPanel />
        </div>
      </div>
      <HostDialog />
    </div>
  )
}
