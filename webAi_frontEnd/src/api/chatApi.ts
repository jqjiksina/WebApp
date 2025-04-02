import type{LogInputRequest, LogInputResponse} from "@/types/input"
import { useChatSessionStore } from "@/store/chatSession";
import { useLogsStore } from "@/store/log";
import type { Log, LogsRecord } from "@/types/chatSession";
import axios, { AxiosError } from "axios";

/**
 * 包含会话的获取、发送的相关API接口
 */
export const chatApi = {
  /**
   * 在当前会话中发送一条消息
   * @param message LogInputRequest{session_id : number, content: string}
   * @returns LogInputRequest{session_id : number, content: string}
   */
  sendLog: async (message : LogInputRequest)=>{
    const response = await axios.post<LogInputResponse>(
      'http://' + import.meta.env.VITE_BACK_END_URL + `/chatLog`,
      message
    )
    return response
  },

  /**
   * 获取用户的所有会话列表，并存入ChatSessionStore
   *  @param timeout_ 超时时间设置
   */
  getChatSession: async (timeout_:number=1000) => {
    const response = await axios.get<{ session: LogsRecord[] }>('http://'+import.meta.env.VITE_BACK_END_URL+`/chatSession`,{timeout:timeout_})
    console.log("getChatSession Response:",response.data)
    const store = useChatSessionStore()
    store.refreshRecords(response.data.session);
  },
  /**
   * 获取指定会话的所有对话记录，并存入LogsStore
   * @param session_id 指定获取的会话id
   * @param timeout_ 超时时间设置
   */
  getLog: async (session_id:number,timeout_:number=1000)=>{
    const store = useLogsStore();
    await axios.get<{logs : Log[]}>('http://'+import.meta.env.VITE_BACK_END_URL+`/chatLog?session_id=${session_id}`,{timeout:timeout_})
    .then((response)=>{
      if (import.meta.env.MODE=="development")
        console.log('axios response: ',response.data)
      store.updateCurrentLogs(response.data.logs);
    }).catch((error)=>{
      if (! (error instanceof AxiosError)) return
      console.log(error.response?.status);
      console.log(error.request?.status);
    })
  }
}
