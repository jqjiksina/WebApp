import axios from 'axios'

// // 创建面试会话
// export function createSession() {
//   return request.post('/api/interview/create-session')
// }

// // 关闭面试会话
// export function closeSession(sessionId: string) {
//   return request.post('/api/interview/close-session', {
//     session_id: sessionId
//   })
// }

// // 通知视频录制完成
// export function notifyVideoComplete(sessionId: string, videoPath: string) {
//   return request.post('/api/interview/notify-video-complete', {
//     session_id: sessionId,
//     video_path: videoPath
//   })
// }

// // 开始数字人录制
// export function startVideoRecord(sessionId: string) {
//   return request.post('/api/interview/start-video-record', {
//     session_id: sessionId
//   })
// }
interface MessageItem{
  role : ("assistant" | "user"),
  content : string
}

interface SessionItem{
  id : string,
  title : string,
  messages : MessageItem[]
}

export const interviewApi = {
    /**
   * 设置用户所连接的数字人会话id
   * @param sessionId 数字人会话id
   */
  setHumanSessionId : async (sessionId: number) => {
    return await axios.post<{session_id : string}>('/api/interview/set_human_session_id', {
      session_id: sessionId
    })
  },

  /**
   * 在指定会话中， 进行一次对话
   */
  chat : async (content : string, sessionId : string) => {
    return await axios.post<{session_id : string}>('/api/interview/answer',
      {
        answer : content,
        session_id : sessionId
      }
    )
  },

  /**
   * 从服务端删除指定会话，若为空，则删除全部
   * @param session_ids 
   * @returns 
   */
  delete_session: async (session_ids : string[]) => {
    return await axios.post("/api/interview/delete_session",
      {session_ids : session_ids}
    )
  },

  /**
   * 获得指定会话历史，若会话id为空，则获得全部
   */
  getSessionHistory: async (sessionId : string)=>{
    return await axios.post<SessionItem[]>("/api/interview/list_session",
      {session_id : sessionId}
    )
  }
}
