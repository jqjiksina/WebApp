<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang='ts'>
import {IconCommunity,FormTest,FloatingAvatar} from '@/components';
import { onMounted, ref } from 'vue';
const floating_container = ref<HTMLElement|null>(null);
onMounted(()=>{
  console.log("Home View Mounted!")
})
</script>

<template>
  <div class='Home floating-container' ref='floating_container'>
    <div class='welcome-container'>
      <div class='welcome-head'>
        <i><IconCommunity/></i>
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
      :size="60"
      :hide-threshold="40"
      :container="floating_container"
    >
      <template #avatarImage><img alt="虚拟形象" @dragstart.prevent src="@/assets/logo.svg"></template>
    </FloatingAvatar>
  </div>
</template>

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
    height: 100%;
    width: 100%
    /* 不可设置justify-content，否则floatingAvatar也将受影响 */
  }

  .floating-container {
    position: relative;
    overflow: hidden;
  }

  i{
    width: 5rem;
  }
</style>
