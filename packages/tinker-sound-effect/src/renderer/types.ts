export interface AudioItem {
  id: string
  text: string
  audioPath: string
  audioUrl: string
}

export type TaskStatus = 'wait' | 'generating'

export interface GenerateTask {
  id: string
  text: string
  status: TaskStatus
}
