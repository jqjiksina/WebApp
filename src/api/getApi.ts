import { useLogsStore } from "@/store/log";
import type { Log, LogsRecord } from "@/types/logList";
import axios, { AxiosError } from "axios";
import { useUsersStore } from "@/store/user";
import { useLogListStore } from "@/store/logList";

export const getApi = {
  getLogList: async (timeout_:number=1000) => {
    const response = await axios.get<LogsRecord[]>('http://'+import.meta.env.VITE_BACK_END_URL+`/${useUsersStore().getUid}/logList`,{timeout:timeout_})
    const store = useLogListStore()
    store.refreshRecords(response.data);
  },
  getLog: async (logKey:string,timeout_:number=1000)=>{
    const store = useLogsStore();
    await axios.get<Log[]>('http://'+import.meta.env.VITE_BACK_END_URL+`/${useUsersStore().getUid}/logList/${logKey}`,{timeout:timeout_})
    .then((response)=>{
      if (import.meta.env.MODE=="development")
        console.log('axios response: ',response.data)
      store.updateCurrentLogs(response.data);
    }).catch((error)=>{
      if (! (error instanceof AxiosError)) return
      console.log(error.response?.status);
      console.log(error.request?.status);
    })
  }
}
