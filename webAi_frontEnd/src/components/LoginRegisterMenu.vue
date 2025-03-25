<template>
  <div class="wrapper" ref="wrapper">
    <div class="head">
      <i style="width: 3rem; height: 100%;display: inline-block; padding:1rem 0 0 1rem;">
        <IconLogo/>
      </i>
      <span class="head-text" style="align-self: center;">
        {{ loginOrRegister ? "注册" : "登录" }}
      </span>
    </div>
    <div class="content">
      <component :is="getCurrentForm"/>
    </div>
    <div class="foot">
      <a @click="switchCurrentForm" style="text-align: center;">
        {{ loginOrRegister ? "已经有账号？点我登录" : "没有账号？点我注册" }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import FormRegister from './Form/FormRegister.vue';
import FormLogin from './Form/FormLogin.vue';
import IconLogo from './icons/IconLogo.vue';

const loginOrRegister = ref(true)
const getCurrentForm = computed(()=>loginOrRegister.value ? FormRegister : FormLogin)
const switchCurrentForm = ()=>{
  loginOrRegister.value = !loginOrRegister.value
}

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
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: start;
}
</style>
