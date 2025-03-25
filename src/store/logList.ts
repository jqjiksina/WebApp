import { defineStore } from "pinia"
import { computed, ref } from "vue";
import type{ LogsRecord } from "@/types/logList";


export const useLogListStore = defineStore('logList',()=>{
  const records = ref<LogsRecord[]>([
    {title: '对话历史1' , url : '/log/1'},
    {title: '对话历史2' , url : '/log/2'},
    {title: '对话历史3' , url : '/log/3'},
  ]);

  const getRecords = computed(()=>records.value)

  function addRecord(record:LogsRecord){
    records.value.push(record)
  }

  function deleteRecord(url:string){
    records.value = records.value.filter((value)=>value.url != url);
  }

  function refreshRecords(records_:LogsRecord[]){
    records.value = records_
  }

  return {getRecords,addRecord,deleteRecord,refreshRecords}
})
