<template>
  <div class="wrapper" ref="wrapper">
    <div class="head">
      <i style="width: 3rem; height: 100%;display: inline-block; padding:1rem 0 0 1rem;">
        <IconLogo/>
      </i>
      <span class="head-text" style="align-self: center;">
        登录
      </span>
    </div>
    <div class="content">
      <FormTest/>
    </div>
    <div class="foot"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import FormTest from './FormRegister.vue';
import IconLogo from './icons/IconLogo.vue';

onMounted(()=>{
  // console.log('loginMenu Mounted')
  wrapperRect.value = wrapper.value.getBoundingClientRect();
  setTimeout(() => {
    document.addEventListener('click',onClickOutside)
  }, 200);
})

onUnmounted(()=>{
  // console.log('loginMenu unMounted')
  document.removeEventListener('click',onClickOutside)
})

function onClickOutside(ev:MouseEvent){
    if(!wrapper.value.contains(ev.target)){
      emit('click-outside',false);
      console.log('LoginMenu click-outside!')
    }
}

const emit = defineEmits(['click-outside'])

const wrapperRect = ref();
const wrapper = ref();
</script>

<style scoped>
.wrapper{
  position: fixed;
  align-self: center;
  top: calc(50% - 15rem);
  left: calc(50% - 10rem);
  width: 20rem;
  height: 30rem;
  background-color: rgb(19, 20, 26);
  color:wheat;

  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  z-index: 9999;
  border: 1px solid rgb(141, 139, 139);
  border-radius: 1rem;
}
.head{
  height: 5rem;
  width: 100%;
  font-size: 1.2rem;
  flex-grow: 0.2;
}
.content{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-grow: 1;
}
.foot{
  width: 100%;
  height: 5rem;
}
</style>
