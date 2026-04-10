import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import queueStore from '../queueStore'
import QueueRow from './QueueRow'

export default observer(function QueueList() {
  const { t } = useTranslation()

  if (queueStore.isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-stone-400 dark:text-stone-500 mb-1">
            {t('queueEmpty')}
          </p>
          <p className="text-xs text-stone-300 dark:text-stone-600">
            {t('addItemsToQueue')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex-1 overflow-y-auto bg-white dark:bg-stone-950 border-r ${tw.border}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#a8a29e #f5f5f4',
      }}
    >
      {queueStore.items.map((item) => (
        <QueueRow key={item.id} item={item} />
      ))}
    </div>
  )
})
