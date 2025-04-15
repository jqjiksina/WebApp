import request from '@/utils/request'
import type { Resume, ResumeFeedback, ResumeChatRequest, ResumeChatResponse } from '@/types/resume'
import { useUsersStore } from '@/store'
import type { AxiosProgressEvent } from 'axios'
import { ref } from 'vue'

const store = useUsersStore()

export const resumeApi = {
  // 对话接口
  chat: async (resume_session_id: string, content: string) => {
    console.log("[Debug] chat begin.")
    const session_id = ref<string>('')
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
                console.log("stream line:",line)
                const data = JSON.parse(line.slice(6)) //前6个字符应该是"data: ""
                if (data.type === 'text') {
                  // 触发自定义事件
                  const event = new CustomEvent('sse-message', { detail: data })
                  window.dispatchEvent(event)
                } else if (data.type === 'end'){
                  session_id.value = data.session_id
                  console.log("onDownloadProgress end.")
                  break
                }
              } catch (e) {
                console.error('解析SSE数据失败:', e)
              }
            }
          }
        }
      }
    )
    console.log("[Debug] chat finished.")
    return session_id.value
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

  // 获取简历历史记录
  getResumeHistory: () => request.get<Resume[]>('/api/resume/history'),

  // 获取简历评分
  getResumeScore: (resumeId: string) => request.get<ResumeFeedback>(`/api/resume/score/${resumeId}`)
}
