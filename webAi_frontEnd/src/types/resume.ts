export interface Resume {
  name: string
  contact: string
  education: string
  projects: string
  skills: string
  selfEvaluation: string
}

export interface ResumeFeedback {
  score: number
  suggestions: string[]
}

export interface ResumeChatResponse {
  session_id: string
  content: string
}

export interface ResumeChatRequest {
  session_id: string
  content: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatSessionState {
  typingIndex: number
  isStreaming: boolean
  lastContent: string   //用于缓存最新的打字机结果
}

export interface ChatSession {
  session_id: string
  messages: ChatMessage[]
  created_at: number
  updated_at: number
  title: string
  state: ChatSessionState
}

export interface ChatHistory {
  sessions: ChatSession[]
  current_session_id: string | null
}
