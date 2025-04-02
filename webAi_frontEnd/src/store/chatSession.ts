import { defineStore } from "pinia"
import { computed, ref } from "vue";
import type{ LogsRecord } from "@/types/chatSession";


export const useChatSessionStore = defineStore('chatSession',()=>{
  const records = ref<LogsRecord[]>([
    // {title: '对话历史1' , session_id : 1},
    // {title: '对话历史2' , session_id : 2},
    // {title: '对话历史3' , session_id : 3},
  ]);

  const curSessionId = ref<number>(0)

  const getCurSessionId = computed(()=>curSessionId.value)
  const getSessions = computed(()=>records.value)

  function changeCurentSession(session_id : number){
    curSessionId.value = session_id
  }

  function addRecord(record:LogsRecord){
    records.value.push(record)
  }

  function deleteRecord(session_id:number){
    records.value = records.value.filter((value)=>value.session_id != session_id);
  }

  function refreshRecords(records_:LogsRecord[]){
    records.value = records_
  }

  return {getSessions,addRecord,deleteRecord,refreshRecords,changeCurentSession,getCurSessionId}
})
