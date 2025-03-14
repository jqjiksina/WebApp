<template>
  <div class='Home' ref='floating_container'>
    <div class='welcome-container'>
      <div class='welcome-head'>
        <IconCommunity/>
        <p>我是Ai-assitant，很高兴见到你！</p>
      </div>
      <div class='welcome-body'>
        <p>test_2</p>
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

<script setup lang='ts'>
import {IconCommunity,FormTest,FloatingAvatar} from '@/components';
import avatar_image from '@/assets/logo.svg';
import { ref } from 'vue';
const floating_container = ref<HTMLElement|null>(null);
</script>


<style scoped>
  .welcome-head{
    font-size:2rem;
    display: flex;
  }

  .welcome-container{
    flex-grow: 1;
    height: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
  }

  .chat-input{
    flex-grow: 1;
    height: 100%;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .Home{
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    width: 100%
    /* display: grid;
    grid-template-rows: 1fr 1fr;
    height: 100%;
    width: 100%; */
  }
</style>
