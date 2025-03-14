import { defineStore } from 'pinia'
import { compute } from 'three/tsl'
import { ref, computed } from 'vue'

interface User{
  name: string,   //用户名
  avatar: string  //头像路径
}
interface Log{
  arrater:  User,
  content:  string
}

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

  return {logs, getLength, getLog}
})

