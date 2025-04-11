<script setup lang="ts">
defineProps<{
  text : string,
}>();
</script>

<template>
  <div class="text-wrapper">
    <p>    {{ text }}  </p>
  </div>
</template>


<style scoped>
.text-wrapper{
  font-size: 5rem;
}
</style>
