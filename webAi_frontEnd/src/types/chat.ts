export interface MessageItem {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface ChatSession {
  id: string
  title: string
  messages: MessageItem[]
  update_time: number
  create_time: number
}

export interface ChatRequest {
  content: string
  session_id?: string
}

export interface ChatResponse {
  session_id: string
  content: string
}

