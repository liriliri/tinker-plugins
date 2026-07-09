import map from 'licia/map'
import toArr from 'licia/toArr'
import type { GamepadState } from '../types'

export function readGamepadState(gpad: Gamepad): GamepadState {
  const b = gpad.buttons
  return {
    leftX: gpad.axes[0] ?? 0,
    leftY: gpad.axes[1] ?? 0,
    rightX: gpad.axes[2] ?? 0,
    rightY: gpad.axes[3] ?? 0,
    l3Pressed: b[10]?.pressed ?? false,
    r3Pressed: b[11]?.pressed ?? false,
    lt: b[6]?.value ?? 0,
    rt: b[7]?.value ?? 0,
    lbPressed: b[4]?.pressed ?? false,
    rbPressed: b[5]?.pressed ?? false,
    APressed: b[0]?.pressed ?? false,
    BPressed: b[1]?.pressed ?? false,
    XPressed: b[2]?.pressed ?? false,
    YPressed: b[3]?.pressed ?? false,
    upPressed: b[12]?.pressed ?? false,
    downPressed: b[13]?.pressed ?? false,
    leftPressed: b[14]?.pressed ?? false,
    rightPressed: b[15]?.pressed ?? false,
    sharePressed: b[8]?.pressed ?? false,
    optionsPressed: b[9]?.pressed ?? false,
    connected: true,
    id: gpad.id,
    axes: toArr(gpad.axes),
    buttonValues: map(toArr(b), (btn) => btn.value),
  }
}

export function renderPath(points: [number, number][]) {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
}

export function stickVisualY(y: number) {
  return -y
}
