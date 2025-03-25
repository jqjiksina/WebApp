import axios from "axios";
import type{LogResponse} from "@/types/input"
import { useLogListStore } from "@/store/logList";

export const inputApi = {
  input: async (text:string,curLog:string)=>{
    if (!curLog) {
      //如果当前是一个新的对话开始，创建一个新的logUrl，然后进行
    }
    await axios.post<LogResponse>(
      'http://' + import.meta.env.VITE_BACK_END_URL + `${logUrl}`,

    )
  }
}
