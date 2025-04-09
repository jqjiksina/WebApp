import type { Log } from '@/types/chat';
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 用于缓存当前sessin的logs记录
 */
export const useLogsStore = defineStore('logs', ()=>{
  const logs = ref<Log[]>([]);

  const getLength = computed(()=>{return logs.value.length});
  /**
   * 获取当前全部log
   */
  const getLogs = computed(()=>logs.value)
  const getLog = computed(()=>{return (nth:number)=>logs.value[nth]});

  function updateCurrentLogs(logs_:Log[]){
    console.log("current log updated")
    logs.value = logs_;
    console.log("updateCurrentLogs:",logs.value)
  }
  return {getLogs, getLength, getLog,updateCurrentLogs}
})

