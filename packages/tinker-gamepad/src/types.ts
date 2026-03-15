export interface GamepadState {
  leftX: number
  leftY: number
  rightX: number
  rightY: number
  l3Pressed: boolean
  r3Pressed: boolean
  lt: number
  rt: number
  lbPressed: boolean
  rbPressed: boolean
  APressed: boolean
  BPressed: boolean
  XPressed: boolean
  YPressed: boolean
  upPressed: boolean
  downPressed: boolean
  leftPressed: boolean
  rightPressed: boolean
  sharePressed: boolean
  optionsPressed: boolean
  connected: boolean
  id: string
  axes: number[]
  buttonValues: number[]
}

export interface StickState {
  x: number
  y: number
  pressed: boolean
}
