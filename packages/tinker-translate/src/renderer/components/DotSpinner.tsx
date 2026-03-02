export default function DotSpinner() {
  return (
    <span className="flex items-center gap-0.75 h-3">
      <span className="w-[3.5px] h-[3.5px] rounded-full bg-current animate-dot-pulse" />
      <span className="w-[3.5px] h-[3.5px] rounded-full bg-current animate-dot-pulse-2" />
      <span className="w-[3.5px] h-[3.5px] rounded-full bg-current animate-dot-pulse-3" />
    </span>
  )
}
