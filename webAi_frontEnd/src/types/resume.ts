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
