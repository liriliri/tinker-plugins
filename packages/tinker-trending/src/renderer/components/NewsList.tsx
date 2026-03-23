import type { NewsItem } from '../../common/types'
import type { SourceColorTokens } from '../theme'
import { tw } from '../theme'

interface HottestListProps {
  items: NewsItem[]
  colors: SourceColorTokens
}

interface TimelineListProps {
  items: NewsItem[]
}

export function HottestList({ items, colors }: HottestListProps) {
  return (
    <ol className="flex flex-col gap-1 p-2">
      {items.map((item, i) => (
        <li
          key={item.id}
          className={`flex items-start gap-2 px-2 py-1.5 cursor-pointer ${tw.list.itemHover} group transition-colors duration-100 rounded-md`}
          onClick={() => trending.openURL(item.url)}
        >
          <span
            className={`${colors.badge} text-[11px] font-medium min-w-[22px] h-[22px] rounded-md flex items-center justify-center shrink-0 mt-0.5 tabular-nums`}
          >
            {i + 1}
          </span>
          <span className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span
              className={`text-[13px] leading-snug ${tw.text.title} ${tw.text.titleHover} line-clamp-2 transition-colors duration-100`}
            >
              {item.title}
            </span>
            {item.extra?.info && (
              <span className={`text-[11px] ${tw.text.muted} tabular-nums`}>
                {item.extra.info}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function TimelineList({ items }: TimelineListProps) {
  return (
    <ol className={`ml-4 border-l ${tw.timeline.border} py-2`}>
      {items.map((item) => (
        <li
          key={item.id}
          className="relative pl-4 mb-2.5 cursor-pointer group"
          onClick={() => trending.openURL(item.url)}
        >
          <span
            className={`absolute -left-[4px] top-[7px] w-1.5 h-1.5 rounded-full ${tw.timeline.dot}`}
          />
          <div className="flex flex-col gap-0.5">
            {item.extra?.date && (
              <span className={`text-[10px] ${tw.text.muted} block`}>
                {new Date(item.extra.date).toLocaleDateString()}
              </span>
            )}
            <span
              className={`text-[13px] leading-snug ${tw.text.title} ${tw.text.titleHover} line-clamp-2 block transition-colors duration-100`}
            >
              {item.title}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
