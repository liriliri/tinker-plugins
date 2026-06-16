export interface HookTypeDef {
  id: 'ready' | 'work' | 'stop' | 'permission'
  file: string
  event: string
  matcher?: string
  cursorEvent?: string
}
