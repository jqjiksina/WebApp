import axios from "axios"

interface MessageItem{
  role : ("assistant" | "user"),
  content : string,
}

export interface SessionItem{
  id : string,
  title : string,
  messages : MessageItem[],
  update_time : number,
  create_time : number
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
   * 在指定会话中， 进行一次对话（非流式接收）
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
  deleteSession: async (session_ids : string[]) => {
    return await axios.post("/api/interview/delete_session",
      {session_ids : session_ids}
    )
  },

  /**
   * 获得指定会话历史，若会话id为空，则获得全部
   */
  listSession: async (sessionId : string)=>{
    return await axios.post<SessionItem[]>("/api/interview/list_session",
      {session_id : sessionId}
    )
  }
}
