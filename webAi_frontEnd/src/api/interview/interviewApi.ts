import { useUsersStore } from '@/store'
import request from '@/utils/request'

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

export const interviewApi = {
    /**
   * 设置用户所连接的数字人会话id
   * @param sessionId 数字人会话id
   */
  setHumanSessionId : async (sessionId: number) => {
    return request.post<{session_id : string}>('http://' + import.meta.env.VITE_BACK_END_URL +'/api/interview/set_human_session_id', {
      session_id: sessionId
    },
    {
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${useUsersStore().getToken}`
      }
    })
  },

  /**
   * 在指定会话中， 进行一次对话
   */
  chat : async (content : string, sessionId : string) => {
    return request.post<{session_id : string}>('http://' + import.meta.env.VITE_BACK_END_URL +'/api/interview/answer',
      {
        answer : content,
        session_id : sessionId
      },
      {
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${useUsersStore().getToken}`
        }
      }
    )
  },



  // /**
  //  * 关闭对应数字人会话id的webrtc链接
  //  * @param sessionId 
  //  * @returns 
  //  */
  // closeSession : async (sessionId: string) => {
  //     return request.post('/digitalperson/close-session', {
  //       session_id: sessionId
  //     })
  // },
}

// 停止数字人录制

// 获取数字人录制的视频
