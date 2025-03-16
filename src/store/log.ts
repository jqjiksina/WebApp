import type { Log } from '@/types/logList';
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLogsStore = defineStore('logs', ()=>{
  const logs = ref([{
    arrater: {name: 'yjh', avatar: ''},
    content: 'saying some words'
    },{
    arrater: {name: 'ai', avatar: ''},
    content: 'saying some words'
    }]);
  const getLength = computed(()=>logs.value.length);
  const getLog = computed(()=>{return (nth:number)=>logs.value[nth]});

  function updateCurrentLogs(logs_:Log[]){
    logs.value = logs_;
  }
  return {logs, getLength, getLog,updateCurrentLogs}
})

