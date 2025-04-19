import request from '@/utils/request'
import type { Resume, ResumeFeedback,  } from '@/types/resume'
import { useUsersStore } from '@/store'
import type { AxiosProgressEvent } from 'axios'

const store = useUsersStore()

export const resumeApi = {
  // 对话接口
  chat: async (resume_session_id: string, content: string) => {
    console.log(`[Debug] chat begin for session: ${resume_session_id}`)
    let resultSessionId = resume_session_id
    
    try {
      await request.post(
        'http://' + import.meta.env.VITE_BACK_END_URL + '/api/resume/chat',
        { session_id: resume_session_id, content: content },
        {
          headers: {
            'Authorization': `Bearer ${store.getToken}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          },
          responseType: 'text',
          onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
            // 获取当前接收到的数据
            const chunk = progressEvent.event?.target?.responseText
            if (!chunk) return

            // 处理新接收到的数据
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  // 从data: 后面解析JSON
                  const jsonText = line.slice(6)
                  console.log("Raw SSE data:", jsonText)
                  
                  // 尝试解析JSON数据
                  let jsonData
                  try {
                    jsonData = JSON.parse(jsonText)
                  } catch (parseError) {
                    // 如果解析失败，记录错误并跳过此行
                    console.warn(`无法解析JSON数据: ${parseError}`, jsonText)
                    continue
                  }
                  
                  console.log("Parsed JSON:", jsonData)
                  
                  const currentSessionId = jsonData.session_id
                  
                  if (jsonData.type === 'text') {
                    console.log("Dispatching text event for session:", currentSessionId)
                    // 触发会话特定的事件
                    const event = new CustomEvent(`sse-message-${currentSessionId}`, { 
                      detail: {
                        content: jsonData.content,
                        session_id: currentSessionId
                      } 
                    })
                    window.dispatchEvent(event)
                  } else if (jsonData.type === 'end') {
                    // 更新结果会话ID
                    resultSessionId = jsonData.session_id
                    console.log(`Chat completed for session ${currentSessionId}`)
                    
                    // 触发会话完成事件
                    const completionEvent = new CustomEvent(`sse-session-completed-${currentSessionId}`, { 
                      detail: { 
                        session_id: currentSessionId ,
                        content : jsonData.content
                      } 
                    })
                    window.dispatchEvent(completionEvent)
                  }
                } catch (e) {
                  console.warn(`处理SSE数据失败:`, e, line)
                  // 尝试提取会话ID（如果存在）以便触发错误事件
                  try {
                    // 如果发生错误但能够解析出会话ID，则触发该会话的错误事件
                    const match = line.match(/"session_id"\s*:\s*"([^"]+)"/)
                    const errorSessionId = match ? match[1] : resume_session_id
                    
                    // 触发错误事件但继续处理其他数据行
                    const errorEvent = new CustomEvent(`sse-error-${errorSessionId}`, { 
                      detail: { error: e, session_id: errorSessionId, message: '数据解析错误' } 
                    })
                    window.dispatchEvent(errorEvent)
                  } catch (_) {
                    // 忽略提取会话ID时的错误
                  }
                }
              }
            }
          }
        }
      )
    } catch (error) {
      console.error(`[Error] chat failed for session ${resume_session_id}:`, error)
      // 触发错误事件
      const errorEvent = new CustomEvent(`sse-error-${resume_session_id}`, { 
        detail: { error, session_id: resume_session_id } 
      })
      window.dispatchEvent(errorEvent)
      
      throw error
    }
    
    console.log(`[Debug] chat finished for session ${resume_session_id}, returned ID: ${resultSessionId}`)
    return resultSessionId
  },

  // 上传简历文件
  upload: async (params: { file: File }) => {
    const formData = new FormData()
    formData.append('file', params.file)
    const response = request.post<{ data: string }>(
      'http://' + import.meta.env.VITE_BACK_END_URL + '/api/resume/upload',
      formData as unknown as Record<string, unknown>,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response
  },

  createNewSession: async () => {
    try {
      const url = 'http://' + import.meta.env.VITE_BACK_END_URL + '/api/resume/newSession'
      const response = await request.get<{session_id : string}>(
        url,
        {
          headers: {
            'Authorization': `Bearer ${store.getToken}`
          }
        }
      )
      console.log("response:", response)
      
      return response.data.session_id
    } catch (error) {
      console.error("createNewSession--创建会话失败:", error)
      throw error
    }
  },

  // 获取简历历史记录
  getResumeHistory: () => request.get<Resume[]>('/api/resume/history'),

  // 获取简历评分
  getResumeScore: (resumeId: string) => request.get<ResumeFeedback>(`/api/resume/score/${resumeId}`)
}
