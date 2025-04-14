export interface Resume {
  name: string
  contact: string
  education: string
  projects: string
  skills: string
  selfEvaluation: string
}

export interface ResumeFeedback {
  suggestions: string[]
  score: number
  improvements: string[]
}
