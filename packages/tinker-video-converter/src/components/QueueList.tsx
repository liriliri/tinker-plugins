import React from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import queueStore from '../queueStore'
import QueueRow from './QueueRow'

export default observer(function QueueList() {
  const { t } = useTranslation()
  const [dragSourceIndex, setDragSourceIndex] = React.useState<number | null>(
    null,
  )
  const [dropTargetIndex, setDropTargetIndex] = React.useState<number | null>(
    null,
  )

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    setDragSourceIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    e.preventDefault()
    if (dragSourceIndex !== null && dragSourceIndex !== targetIndex) {
      queueStore.moveItem(dragSourceIndex, targetIndex)
    }
    setDragSourceIndex(null)
    setDropTargetIndex(null)
  }

  const handleDragEnd = () => {
    setDragSourceIndex(null)
    setDropTargetIndex(null)
  }

  if (queueStore.isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-stone-500 mb-1">{t('queueEmpty')}</p>
          <p className="text-xs text-stone-600">{t('addItemsToQueue')}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex-1 overflow-y-auto bg-stone-950 border-r ${tw.border}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#44403c #1c1917',
      }}
    >
      {queueStore.items.map((item, index) => (
        <QueueRow
          key={item.id}
          item={item}
          index={index}
          isDragSource={dragSourceIndex === index}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  )
})
