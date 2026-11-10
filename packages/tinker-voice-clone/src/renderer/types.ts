export interface AudioItem {
  id: string
  text: string
  audioPath: string
  mimeType: string
  audioUrl: string
  createdAt: number
}

export interface GenerateTask {
  id: string
  text: string
  status: 'wait' | 'generating'
}
