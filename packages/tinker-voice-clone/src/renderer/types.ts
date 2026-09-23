export interface AudioItem {
  id: string
  text: string
  audioPath: string
  mimeType: string
  audioUrl: string
  createdAt: number
}

export type TaskStatus = 'wait' | 'generating'

export interface GenerateTask {
  id: string
  text: string
  status: TaskStatus
}
