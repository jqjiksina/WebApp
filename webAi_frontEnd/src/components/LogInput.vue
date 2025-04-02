<template>
  <div class="wrapper">
    <div class="content">
      <input type="text" placeholder="输入内容" v-model="input_text">
    </div>
    <div class="foot">
      <i></i><i></i><i class="enter" @click="inputLog">what</i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { chatApi } from '@/api/chatApi';
import { useChatSessionStore } from '@/store/chatSession';
import type { LogInputRequest } from '@/types/input';

const chatSessionStore = useChatSessionStore()
const input_text = ref('')
const inputLog = async ()=>{
  //将输入框内容post到后端，后端ai响应内容
  console.log('inputLog!')
  const request  = ref<LogInputRequest>({session_id:chatSessionStore.getCurSessionId,content:"test_content"})
  const response = await chatApi.sendLog(request.value)
  chatSessionStore.changeCurentSession(response.data.session_id)
}
</script>

<style scoped>
:root{
  --total-height: 100px;
  --total-width: 80%;
  --background-color: rgb(46, 46, 46);
}
i{
  width:40px;height: 40px;
  border-radius: 20px;
  &:hover{
    background-color: rgb(49, 49, 49);
    transition: background-color 0.3s ease-in-out;
  }
}
.enter{
  position: absolute;
  right: 0px;
  margin:auto 2px;
}
.wrapper{
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-around;
  background-color: var(--background-color);

  .content input{
    min-height: 80px;
    max-height: 30vh;
    text-wrap: wrap;
    overflow-y: auto;
    background-color: rgb(78, 72, 72);
    color: white;
    font-size:1rem;
    flex-grow: 1;
  }
  .foot{
    width: 100%;
    height: 2rem;
    flex-grow: 0;
    position: relative;
  }
}
</style>
