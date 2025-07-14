<template>
    <div class="maganism-container">
        <el-card style="height: 100%;" body-style="height: 100%;">
            <template #header>电磁场与电磁波知识图谱</template>
            <Canvas :nodes="[]" :edges="[]"></Canvas>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import Canvas from '../canvas.vue';
</script>

<style scoped>
.maganism-container{
    width: 100%;
    height: 100%;
}
</style>