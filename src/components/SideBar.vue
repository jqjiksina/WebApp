<script setup lang="ts">
import { Draggable } from 'gsap/all';
import {ref, type CSSProperties} from 'vue';
import IconCommunity from './icons/IconCommunity.vue';
import SideBarMenu from './SideBarMenu.vue';
const dataList = [
  {content: '首页' },
  {content: '项目管理' },
  {content: '用户管理' },
  {content: '文件管理' },
  {content: '设置' },
  {content: '退出' },
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
  {content: '更多'},
]
const showMenu = ref(false);
const onAvatarClick = ()=>{
  showMenu.value = !showMenu.value;
};

</script>

<template>

    <div class="side-head">
      <img alt="Vue logo" class="logo" src="@/assets/logo.svg"/>
      <div class="logo-name">
        <span>Vue</span>
      </div>
    </div>
    <div class="side-content-container">
      <li v-for="data in dataList" class="side-content" :key="data.content">
        <span>{{ data.content }}</span>
      </li>
    </div>
    <div class="side-foot">
      <!-- <button class="avatar" @click="onAvatarClick">
        <img alt="userAvatar" src="@/assets/logo.svg" :style="{width:'50px',height:'100%'}" @dragstart.prevent/>
        <span>用户信息</span>
      </button>
      <div class="avatar-menu" v-show="showMenu">
        <button><IconCommunity :style="{'margin-right':'18px'}"/><span>登录</span></button>
        <button><IconCommunity :style="{'margin-right':'18px'}"/><span>信息</span></button>
        <button><IconCommunity :style="{'margin-right':'18px'}"/><span>其他</span></button>
        <button><IconCommunity :style="{'margin-right':'18px'}"/><span>帮助</span></button>
        <button><IconCommunity :style="{'margin-right':'18px'}"/><span>退出</span></button>
      </div> -->
      <SideBarMenu/>
    </div>
</template>

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
