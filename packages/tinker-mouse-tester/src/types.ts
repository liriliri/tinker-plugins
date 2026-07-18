export type WheelDirection = 'up' | 'down' | null

export interface MousePoint {
  x: number
  y: number
}

export const MOUSE_BUTTON_KEYS: Record<number, string> = {
  0: 'leftClick',
  1: 'middleClick',
  2: 'rightClick',
  3: 'backButton',
  4: 'forwardButton',
}
