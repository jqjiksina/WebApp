<template>
    <div class="function-container">
        <el-card style="height: 100%;" body-style="height: 100%;">
            <template #header>数理方程与特殊函数知识图谱</template>
            <Canvas :nodes="[]" :edges="[]"></Canvas>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import Canvas from '../canvas.vue';
</script>

<style scoped>
.function-container{
    width: 100%;
    height: 100%;
}
</style>