<template>
    <div class="integral-container">
        <el-card style="height: 100%;" body-style="height: 100%;">
            <template #header>微积分知识图谱</template>
            <Canvas :nodes="nodes" :edges="edges"></Canvas>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { Ref, ref } from 'vue';
import Canvas from '../canvas.vue';
const nodes : Ref<GraphNode[]>= ref([
    {
        id : '0',
        description : "root",
        relativeNode : ['','','','',''],
        x : 0, y : 0, radius : 20,
        showDescription: false
    },{
        id : '1',
        description : "node 1",
        relativeNode : ['','','','',''],
        x : 0, y : 20, radius : 20,
        showDescription: false
    },{
        id : '2',
        description : "node 2",
        relativeNode : ['','','','',''],
        x : 0, y : 40, radius : 20,
        showDescription: false
    },{
        id : '3',
        description : "node 3",
        relativeNode : ['','','','',''],
        x : 0, y : 40, radius : 20,
        showDescription: false
    }
])

const edges = ref([
    {
        id : '1',
        description : 'edge 1',
        head : '0',
        tail : '1'
    },{
        id : '2',
        description : 'edge 2',
        head : '0',
        tail : '2'
    },{
        id : '3',
        description : 'edge 3',
        head : '1',
        tail : '3'
    }
])

</script>

<style scoped>
.integral-container{
    width: 100%;
    height: 100%;
}
</style>