/**
 * 一条输入/输出
 */
interface Log{
  isSpeakerUser:  boolean,
  content:  string
}

/**
 * 一则对话历史记录
 */
interface LogsRecord{
  session_id : number,
  title : string
}

export type{Log, LogsRecord}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export interface ChatRequest {
  session_id: string
  content: string
}

export interface ChatResponse {
  data:{
    session_id: string
    answer: string
  }
}