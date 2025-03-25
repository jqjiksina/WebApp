import type { Log } from '@/types/logList';
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLogsStore = defineStore('logs', ()=>{
  const logs = ref([{ //仅缓存一个对话历史？
    isSpeakerUser: true,
    content: 'saying some words'
    },{
    isSpeakerUser: false,
    content: 'saying some words'
    }]);
  const getLength = computed(()=>logs.value.length);
  const getLog = computed(()=>{return (nth:number)=>logs.value[nth]});

  function updateCurrentLogs(logs_:Log[]){
    logs.value = logs_;
  }
  return {logs, getLength, getLog,updateCurrentLogs}
})

