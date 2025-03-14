<script setup lang="ts">
import {ref} from 'vue';
import { useLogsStore } from '@/store/log';
import { FormTest,FloatingAvatar } from '@/components';
import avatar_image from '@/assets/logo.svg';
const store = useLogsStore();
const logItems = store.logs;

const log_style = (name:string) => {
  if (name === 'ai') return { order: '0', 'margin':'2px -27px auto 5px'}
  else return {order : '1','margin':'2px 5px auto -27px'};
};

const floating_container = ref<HTMLElement|null>(null);
</script>

<template>
  <div class="topic"><p>test_title</p></div>
  <div class="chat-wrapper floating-container" ref="floating_container">
    <div class="chat-log">
      <div v-for="logItem in logItems" :key="logItem.content" class="log">
        <div class="log-avatar" :style=log_style(logItem.arrater.name)>
          <img :src=logItem.arrater.avatar alt="avatar">
        </div>
        <div class="log-content">
          <span>{{ logItem.content }}</span>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <FormTest/>
    </div>

    <FloatingAvatar
      :avatar-image="avatar_image"
      :size="60"
      :hide-threshold="40"
      :container="floating_container"
    />
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
.chat-input{
  height: 10rem;
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
  display: flex;
  flex-direction: column;
}
</style>
