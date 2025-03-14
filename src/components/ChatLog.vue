
<script setup lang="ts">

interface User{
  name: string,   //用户名
  avatar: string  //头像路径
}
interface Log{
  arrater:  User,
  content:  string
}
defineProps<{
  logItems : Log[]
}>();

const log_style = (name:string) => {
  if (name === 'ai') return { order: '0', 'margin':'2px -27px auto 5px'}
  else return {order : '1','margin':'2px 5px auto -27px'};
};
</script>

<template>
  <div class="log-container">
    <div v-for="logItem in logItems" :key="logItem.content" class="log">
      <div class="log-avatar" :style=log_style(logItem.arrater.name)>
        <img :src=logItem.arrater.avatar alt="avatar">
      </div>
      <div class="log-content">
        <span>{{ logItem.content }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
.log-container{
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow-x:hidden;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
}
</style>
