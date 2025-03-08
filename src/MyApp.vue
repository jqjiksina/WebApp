<script setup lang="ts" name="App">
import FloatingAvatar from './components/FloatingAvatar.vue';
import SideBar from './components/SideBar.vue';
// import SwitchText from './components/SwitchText/SwitchText.vue';
import { ref } from 'vue';
import avatar_image from '@/assets/logo.svg';
// import FloatingModel from './components/FloatingModel.vue'
import FormTest from './components/FormTest.vue';
import ChatLog from './components/ChatLog.vue';

const floating_container = ref<HTMLElement | null>(null);

interface User{
  name: string,   //用户名
  avatar: string  //头像路径
}
interface Log{
  arrater:  User,
  content:  string
}
const log_items: Log[] = [{
    arrater: {name: 'yjh', avatar: ''},
    content: 'saying some words'
  },{
    arrater: {name: 'ai', avatar: ''},
    content: 'saying some words'
  }
]
</script>

<template>
  <!--组件切换动态改变width-->
  <div class="side-bar"><SideBar/></div>
  <main>
    <div class="topic">test_title</div>
    <div class="log-wrapper floating-container" ref="floating_container">
      <div class="chat-log">
        <ChatLog :log-items="log_items"/>
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

      <!-- <FloatingModel
      :model-url="'/model/cat_girl/scene.gltf'"
      /> -->
      <!-- <div class="ai-assitant"><Avatar/></div> -->
    </div>
  </main>
</template>

<style>
.side-bar{
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-width: 30vw;
  border: solid 1px #fff;
  border-radius: 12px;
  height: 100vh;
}

main {
  display:flex;
  flex-direction: column;
  justify-content: space-between;
}

.topic {
  height: 2rem;
  text-align: center;
}

.log-wrapper {
  display: grid;
  grid-template-rows: 1fr 5rem;
  height: calc(100vh - 2rem);
  width: 100%;
}

.floating-container {
  position: relative;
  overflow: hidden;
}

.chat-log {
  height: calc(100vh - 2rem - 5rem);
  width: 100%;
}

.chat-input {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-assitant{
  position: relative;
  float: left;
}

</style>
