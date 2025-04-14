import request from '@/utils/request'
import type { Resume, ResumeFeedback } from '@/types/resume'
import { useUsersStore } from '@/store'

const store = useUsersStore()

export const resumeApi = {
  // 对话接口
  chat: (resume_session_id:string,content: string) =>
    request.post<{ session_id:string, content: string }>(
      'http://' + import.meta.env.VITE_BACK_END_URL+'/api/resume/chat',
      {session_id:resume_session_id,content:content }),

  // 上传简历文件s
  upload: async (params) => {
    const formData = new FormData()
    formData.append('file', params.file)
    const response = request.post<{ data: string }>('http://' + import.meta.env.VITE_BACK_END_URL+'/api/resume/upload', formData as unknown as Record<string, unknown>, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  },

  // 获取简历历史记录
  getResumeHistory: () => request.get<Resume[]>('/api/resume/history'),

  // 获取简历评分
  getResumeScore: (resumeId: string) => request.get<ResumeFeedback>(`/api/resume/score/${resumeId}`)
}
