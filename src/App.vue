<script setup lang="ts" name="App">
import { RouterView } from 'vue-router';
import {SideBar} from '@/components/index.ts';
</script>

<template>
  <!--组件切换动态改变width-->
  <div class="side-bar"><SideBar/></div>
  <main>
    <RouterView/>
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

main{
  display:flex;
  flex-direction: column;
  justify-content: space-between;
}

.log-wrapper {
  display: grid;
  grid-template-rows: 1fr 5rem;
  height: calc(100vh - 2rem);
  width: 100%;
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
