import type { WeatherIconType } from '../types'
import SunIcon from '../assets/sun.svg?react'
import CloudIcon from '../assets/cloud.svg?react'
import RainIcon from '../assets/rain.svg?react'
import DrizzleIcon from '../assets/drizzle.svg?react'
import SnowIcon from '../assets/snow.svg?react'
import ThunderIcon from '../assets/thunder.svg?react'
import FogIcon from '../assets/fog.svg?react'
import WindIcon from '../assets/wind.svg?react'

interface IconProps {
  size?: number
  className?: string
}

interface WeatherIconProps extends IconProps {
  type: WeatherIconType
}

const ICON_MAP: Record<
  WeatherIconType,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  sun: SunIcon,
  cloud: CloudIcon,
  rain: RainIcon,
  drizzle: DrizzleIcon,
  snow: SnowIcon,
  thunder: ThunderIcon,
  fog: FogIcon,
  wind: WindIcon,
}

export default function WeatherIcon({
  type,
  size = 48,
  className,
}: WeatherIconProps) {
  const Icon = ICON_MAP[type] || CloudIcon
  return <Icon width={size} height={size} className={className} />
}
