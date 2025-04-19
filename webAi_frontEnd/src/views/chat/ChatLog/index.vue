<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import {computed, onMounted, ref, watch, type ComputedRef} from 'vue';
import { useLogsStore } from '@/store/modules/chatLog';
import { FloatingAvatar } from '@/components';
import type {Log} from '@/types/chat'
import { chatApi } from '@/api/chat/chatApi';
import LogInput from '@/components/LogInput.vue';
import { useUsersStore } from '@/store/modules/user';

const logItems : ComputedRef<Log[]> = computed(()=>useLogsStore().getLogs); // 一定要用computed！才能保证变量保持响应性！

const props = defineProps<{ //Chatlog mounted时，通过url路由传参得到参数，然后请求后端数据到logitems！
  session_id: number
}>();

const log_style = (isSpeakerUser:boolean) => {
  if (!isSpeakerUser) return { order: '0', 'margin':'2px -27px auto 5px'}
  else return {order : '1','margin':'2px 5px auto -27px'};
};

const floating_container = ref<HTMLElement|null>(null);
onMounted(async ()=>{
  console.log("Chatlog View Mounted!" + " props: " + props.session_id)
  // chatApi.getLog(props.session_id)
  watch(()=>{return {id:props.session_id,store:useUsersStore().getToken}},async ()=>{
    console.log("chatsession id changed: " + props.session_id)
    chatApi.getLog(props.session_id)
  })
})



const getUserAvatar = ()=>{
  return ' '
}
</script>

<template>
  <div class="topic"><p>test_title</p></div>
  <div class="chat-wrapper floating-container" ref="floating_container">
    <div class="chat-log">
      <div v-for="logItem in logItems" :key="logItem.content" class="log">
        <div class="log-avatar" :style=log_style(logItem.isSpeakerUser)>
          <img :src='logItem.isSpeakerUser?getUserAvatar():"aiAvatar"' alt="avatar"> <!--根据对话者加载对应头像-->
        </div>
        <div class="log-content">
          <span>{{ logItem.content }}</span>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <LogInput/>
    </div>

    <FloatingAvatar
      :size="60"
      :hide-threshold="40"
      :container="floating_container"
    >
      <template #avatarImage><img alt="虚拟形象" @dragstart.prevent src="@/assets/logo.svg"></template>
    </FloatingAvatar>
  </div>
</template>

<style scoped>
.topic {
  height: 4rem;
  text-align: center;
  align-items: center;
  font-size: 1.5rem;
  background-color: rgb(63, 63, 63);
  box-shadow: 10px 5px 10px 10px rgb(29, 28, 28);  /*x,y,blurR,spreadR*/
  z-index: 1;
}

.chat-input {
  flex-grow: 0;
  height: 10rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: flex-start;
}
.log{
  position: relative;
  display: flex;
  padding: 5px 10px;
}
.log-avatar{
    width: 20px;
    height: 20px;
}
.log-content{
    margin: 2px 50px 5px 50px;
    background-color: rgb(97, 96, 96);
    border-radius: 5px;
    border: 2px solid #8b8b8b;
    font-size: 1rem;
    flex-grow: 1;
    height: fit-content;
}
.chat-log{
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow-x:hidden;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
}
.floating-container {
  position: relative;
  overflow: hidden;
}
.chat-wrapper{
  width:100%;
  height:100%;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
}
</style>
