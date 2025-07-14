<template>
  <div class="canva-container" ref="canvaContainer">
    <div class="stage-container" ref="stageContainer">
      <konva-stage :config="stageConfig" ref="stage" 
        @wheel="handleWheel" 
        @click="handleStageClick"
        @dragmove="handleStageDrag"
      >
        <konva-layer ref="gridLayer">
          <konva-line v-for="(lineConfig,index) in lines" :key="index" :config="lineConfig"></konva-line>
        </konva-layer>
        <konva-layer ref="layer1">
          <!-- <konva-circle :config="circleConfig" @click="handleNodeClick(1)"/> -->
          <konva-line v-for="edge in props.edges" :key="edge.id" :config="edgeConfig(edge)"/>
          <konva-circle 
            :config="nodeConfig(node)" 
            v-for="node in props.nodes" :key="node.id"
            @mouseover="handleNodeOver(node)"
            @mouseleave="handleNodeLeave(node)"
            @mousedown="$event.cancelBubble=true"
            @click = "handleNodeClick($event,node)"
          />
        </konva-layer>
        <konva-layer ref="textLayer">
          <konva-group 
            v-for="node in props.nodes" :key="node.id"
            :config="groupConfig(node)"
            @mouseover="handleTextOver(node)"
            @mouseleave="handleTextLeave(node)"
            @mousedown="$event.cancelBubble=true"
            @click="$event.cancelBubble=true"
          >
            <konva-rect :config="rectConfig(node)"/>
            <konva-text :config="textConfig(node)"/>
          </konva-group>
        </konva-layer>

      </konva-stage>
    </div>
    <div class="info" style="font-size: 2rem;" ref="infoRef">
      {{ debugText }}
      <el-button @click="runLayout" style="height: 30px;">重新生成</el-button>
      <el-button @click="handleAuto" style="height: 30px;">定位</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref} from 'vue';
import { Layer } from 'konva/lib/Layer';
import { Stage } from 'konva/lib/Stage';
import Konva from 'konva';
import { random } from 'lodash';

const props = defineProps<{
  nodes : GraphNode[]
  edges : GraphEdge[]
}>()

const handleStageDrag = ()=>{
  debugText.value = `stage.x:${stage.value?.getStage().x().toFixed(0).toString()},
  stage.y:${stage.value?.getStage().y().toFixed(0).toString()}`
}
const handleStageClick = (_e : Konva.KonvaEventObject<MouseEvent>)=>{
  // e.evt.stopImmediatePropagation()
  console.log("stage clicked!")
}
const handleNodeOver = (node : GraphNode)=>{
  node.radius = 30
  node.showDescription = true
}
const handleNodeLeave = (node : GraphNode)=>{
  node.radius = 20
  node.showDescription = false
}
const handleNodeClick = (e : Konva.KonvaEventObject<MouseEvent>,_node : GraphNode)=>{
  e.cancelBubble=true
  console.log("node clicked!")
  //结点展开
}

const handleTextOver = (node : GraphNode)=>{
  node.showDescription = true
}
const handleTextLeave = (node : GraphNode)=>{
  node.showDescription = false
}

const handleAuto = ()=>{
  stage.value?.getStage().x(0)
  stage.value?.getStage().y(0)
  stage.value?.getStage().scaleX(1)
  stage.value?.getStage().scaleY(1)
  debugText.value = `stage.x:${stage.value?.getStage().x().toFixed(0).toString()},
  stage.y:${stage.value?.getStage().y().toFixed(0).toString()}`
}

/**
 * 知识图谱布局算法：基于力导向的简单布局
 */
const runLayout = () => {
  const centerX = stageConfig.value.width / 2;
  const centerY = stageConfig.value.height / 2;
  const k = 0.1; // 弹力系数
  const repulsion = 1000; // 排斥力
  
  props.nodes.forEach(node => {
    if (node.id === '0'){  // 根节点居中
      node.x = centerX;
      node.y = centerY;
    } else{             // 其他节点随机分布
      node.x = random(true) * width.value
      node.y = random(true) * height.value
    }
  })
  
  // 力导向迭代
  for (let i = 0; i < 100; i++) {
    props.nodes.forEach(node => {
      if (node.id === '0') return;
      
      // 吸引力（向连接节点）
      let dx = 0, dy = 0;
      props.edges.filter(e => e.head === node.id || e.tail === node.id)
        .forEach(edge => {
          const otherId = edge.head === node.id ? edge.tail : edge.head;
          const other = props.nodes.find(n => n.id === otherId);
          if (other) {
            const angle = Math.atan2(other.y - node.y, other.x - node.x);
            dx += Math.cos(angle) * k;
            dy += Math.sin(angle) * k;
          }
        });
      
      // 排斥力（所有节点间）
      props.nodes.forEach(other => {
        if (other !== node) {
          const distance = Math.sqrt(
            Math.pow(node.x - other.x, 2) + Math.pow(node.y - other.y, 2)
          );
          if (distance > 0 && distance < repulsion * 2) {
            const force = repulsion / Math.pow(distance, 2);
            const angle = Math.atan2(node.y - other.y, node.x - other.x);
            dx += Math.cos(angle) * force;
            dy += Math.sin(angle) * force;
          }
        }
      });
      
      // 更新位置（带阻尼）
      node.x += dx * 50;
      node.y += dy * 50;
    });
  }
};

onMounted(()=>{
  //Stage config
  width.value = infoRef.value?.getBoundingClientRect().width
  height.value = (canvaContainer.value?.getBoundingClientRect().height || 0) - (infoRef.value?.getBoundingClientRect().height || 0) - 80  
  // console.log(canvaContainer.value?.getBoundingClientRect().height,infoRef.value?.getBoundingClientRect().height)

  stageConfig.value={
    width:width,
    height:height,
    scaleX:1,
    scaleY:1,
    draggable: true
  }

  //Layer: 网格层
  for (let y = 0; y < height.value; y += gridSize.value) {
    lines.value.push({
      points: [0, y, width.value, y],
      stroke: '#e0e0e0',
      strokeWidth: 2,
      dash: [2, 2]
    });
  }

  for (let x = 0; x < width.value; x += gridSize.value) {
    lines.value.push({
      points: [x, 0, x, height.value],
      stroke: '#e0e0e0',
      strokeWidth: 2,
      dash: [2, 2]
    });
  }

  runLayout()
})

const handleWheel = (e : Konva.KonvaEventObject<WheelEvent>)=>{
  stageConfig.value.scaleX = stageConfig.value.scaleX + (e.evt.deltaY > 0 ? -0.1 : 0.1);
  stageConfig.value.scaleY = stageConfig.value.scaleY + (e.evt.deltaY > 0 ? -0.1 : 0.1);
  e.evt.stopPropagation()
}

// const handleNodeClick = (key:number)=>{
//   console.log(`Node ${key} licked!`)
// }
const stageContainer = ref<HTMLDivElement>()
const canvaContainer = ref<HTMLDivElement>()
const infoRef = ref<HTMLDivElement>()

const debugText = ref<string>()

// canva config
const width = ref()
const height = ref()

const stage = ref<Stage>()
const stageConfig=ref()

const gridLayer = ref<Layer>()
const gridSize = ref(30)
const lines : Ref<Konva.LineConfig[]> = ref([]);

const layer1 = ref<Layer>()
const edgeConfig = (edge : GraphEdge)=>{
  let headNode : GraphNode = props.nodes[0]
  let tailNode : GraphNode = props.nodes[1]
  props.nodes.forEach(node=>{
    if (node.id === edge.head){
      headNode = node
    } else if (node.id === edge.tail){
      tailNode = node
    }
  })
  return{
    points: [headNode.x, headNode.y, tailNode.x, tailNode.y],
    stroke: '#FE9900',
    strokeWidth: 4,
  }
}
const nodeConfig = (node : GraphNode)=>{
  return {  
    x: node.x,
    y: node.y,
    radius: node.radius,
    fill: node.id=='0'?'#D20103':'#00D2FF',
    stroke: 'black',
    strokeWidth: 2
  }
}

const textLayer = ref<Layer>()
const groupConfig = (node:GraphNode)=>{
  return {
    x : 0,
    y : 0,
    visible : node.showDescription
  }
}
const rectConfig = (node : GraphNode)=>{
  return {
    x: node.x + 20,
    y: node.y - 20,
    stroke: '#555',
    strokeWidth: 5,
    fill: '#ddd',
    width: 300,
    height: 200, // Approximate height
    shadowColor: 'black',
    shadowBlur: 10,
    shadowOffsetX: 10,
    shadowOffsetY: 10,
    shadowOpacity: 0.2,
    cornerRadius: 10
  };
}
const textConfig = (node : GraphNode)=>{
  return {
    x: node.x + 20,
    y: node.y - 20,
    text: node.description,
    fontSize: 18,
    fontFamily: 'Calibri',
    fill: '#555',
    width: 300,
    padding: 20,
    align: 'center'
  }
}

// watchEffect(()=>{
  
// })

</script>

<style scoped>
.canva-container{
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>