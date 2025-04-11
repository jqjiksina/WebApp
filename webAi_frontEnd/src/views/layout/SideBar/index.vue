<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="side-head" @click="onSideHeadClick">
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg"/>
    <div class="logo-name">
      <span>Vue</span>
    </div>
  </div>
  <div class="side-content-container">
    <li v-for="record in chatSession" class="side-content" :key="record.session_id" @click="onClickSpan(record.session_id)">
      <span>{{ record.title }}</span>
    </li>
  </div>
  <div class="side-foot">
     <SideBarMenu/>
  </div>
</template>

<script setup lang="ts">
// import { Draggable } from 'gsap/all';
// import IconCommunity from './icons/IconCommunity.vue';
import {chatApi } from '@/api/chatApi';
import SideBarMenu from '@/views/SideBar/SideBarMenu.vue';
import router from '@/router';
import { useChatSessionStore as useChatSessionStore } from '@/store/chatSession';

import { computed, onBeforeMount, watch } from 'vue';
import { useUsersStore } from '@/store/user';
const store = useChatSessionStore()
const chatSession = computed(()=>store.getSessions);

onBeforeMount(()=>{
  console.log("before SideBar mount")
  const userStore = useUsersStore()
  watch(()=>userStore.getToken,()=>{
    chatApi.getChatSession();
  })
})

const onClickSpan = async (key:number)=>{
  router.push(`/session/${key}`)
  store.changeCurentSession(key)
}

const onSideHeadClick = ()=>{
  router.push('/')
  store.changeCurentSession(0)
}
</script>

<style scoped>
.side-head {
  background-color: #333;
  align-items: center;
  display: grid;
  grid-template-columns: auto auto;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.logo {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  margin-left: 10px;
  align-content: center;
  justify-content: center;
  align-items: center;
}

.logo-name {
  font-size: 20px;
  color: #fff;
}

.side-content-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
}

.side-content {
  color: #fff;
  cursor: pointer;
  padding: 5px 0 5px 1rem;
  transition: background-color 0.3s ease;
  flex-wrap: nowrap;
  font-size: 1rem;
}

.side-content:hover{
  background-color: #444;
}

.side-foot {
  border-top: 1px solid;
  background-color: #333;
  color: #fff;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  flex-grow: 0;
  height: 50px;
  position: relative;
}
.avatar{
  border-radius: 0px 0px 12px 12px;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.avatar-menu{
  position: absolute;
  top: -200px;
  height: 200px;
  width: 120px;
  opacity: 1;
  z-index: 10;
  background-color: #333;
  display: flex;
  flex-direction: column;
}
.avatar:hover{
  background-color: #444;
  transition: background-color 0.3s ease;
}
button:hover{
  background-color: #444;
  transition: background-color 0.3s ease;
}
</style>
