<script setup lang="ts">
import { computed, ref } from 'vue';
import TextWrapper from './TextWrapper.vue';
const props = defineProps<{
  text1: string,
  text2: string,
}>();
const ok = ref(false);
const currentText = computed(()=> ok.value?props.text1:props.text2);
const onClick = ()=>{
  ok.value = !ok.value;
};
</script>

<template>
  <button @click="onClick">
    <Transition name="text-change" mode="out-in">
      <component :is=TextWrapper :text=currentText :key="currentText"/>
    </Transition>
  </button>
</template>


<style scoped>
  .text-change-enter-active,
  .text-change-leave-active {
    transition: all 0.5s ease;
  }

  .text-change-enter-from,
  .text-change-leave-to {
    opacity: 0;
  }

  div.text-wrapper {
    color: rgb(91, 155, 201);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  button{
    border: none;
    background-color: rgb(0, 0, 0);
    color: #fff;
    width: 100%;
    height: 100%;
  }
</style>
