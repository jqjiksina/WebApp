<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!--组件切换动态改变width-->
  <div class="side-bar"><SideBar/></div>
  <main>
    <RouterView/>
  </main>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import SideBar from '@/views/SideBar/index.vue';
</script>


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

</style>
