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
          <konva-group
            v-for="node in props.nodes" :key="node.id"
            :config="{x:node.x,y:node.y}"
          >
            <konva-circle 
              :config="nodeConfig(node)" 
              @mouseover="handleNodeOver(node)"
              @mouseleave="handleNodeLeave(node)"
              @mousedown="$event.cancelBubble=true"
              @click = "handleNodeClick($event,node)"
            />
            <konva-text
              :config="nameConfig(node)"
            />
          </konva-group>
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
            <konva-rect :config="rectConfig"/>
            <konva-text :config="descriptionConfig(node)"/>
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
import { onMounted, Ref, ref, watch} from 'vue';
import { Layer } from 'konva/lib/Layer';
import { Stage } from 'konva/lib/Stage';
import Konva from 'konva';

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
  node.radius = 35
  node.showDescription = true
}
const handleNodeLeave = (node : GraphNode)=>{
  node.radius = 30
  node.showDescription = false
}
const handleNodeClick = (e : Konva.KonvaEventObject<MouseEvent>,_node : GraphNode)=>{
  e.cancelBubble=true
  console.log("node clicked!")
  //结点展开
}
const handleTextOver = (node : GraphNode)=>{
  node.radius=35
  node.showDescription = true
}
const handleTextLeave = (node : GraphNode)=>{
  node.radius = 30
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
 * 知识图谱布局算法：优化力导向布局
 * 
 * 优化点：
 * 1. 引入Barnes-Hut算法优化斥力计算 (O(n²) -> O(n log n))
 * 2. 添加温度冷却系统控制收敛
 * 3. 增加边界约束防止节点飞散
 * 4. 添加速度限制和阻尼
 * 5. 区分不同力的计算方式
 */
 const runLayout = () => {
  const boundaryFactor = 5; // boundary相对stageWidth的倍数
  const centerX = stageConfig.value.width * boundaryFactor / 2;
  const centerY = stageConfig.value.height * boundaryFactor / 2;
  
  // 优化参数配置
  const params = {
    repulsion: 1000,      // 斥力强度
    attraction: 0.10,      // 引力系数
    centerAttraction: 0.01, // 中心引力
    maxSpeed: 20,          // 最大移动速度
    theta: 0.5,           // Barnes-Hut参数
    temperature: 150,     // 初始温度
    coolingFactor: 0.98   // 冷却因子
  };
  
  // // 初始化节点位置和速度
  // props.nodes.forEach((node : GraphNode) => {
  //   if (!node.vx) node.vx = 0;
  //   if (!node.vy) node.vy = 0;
    
  //   if (node.id === '0' || node.id==='1-1-1-1') {  // 根节点居中
  //     node.x = centerX;
  //     node.y = centerY;
  //   } else if (!node.x || !node.y) { // 其他节点随机分布
  //     node.x = Math.random() * stageConfig.value.width*boundaryFactor;
  //     node.y = Math.random() * stageConfig.value.height*boundaryFactor;
  //   }
  // });

  // 1. 层次化排序
  const orderedNodes : GraphNode[] = [];
  const queue = [props.nodes.find(n => n.id === '0' || n.id==='1-1-1-1')]; // 从根节点开始
  
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) continue;
    
    orderedNodes.push(node);
    
    // 按度排序子节点（减少交叉的关键）
    const children = props.edges
      .filter(e => e.head === node.id)
      .map(e => props.nodes.find(n => n.id === e.tail))
      .filter(n => n && !orderedNodes.includes(n))
      .sort((a, b) => {
        // 优先显示度大的节点（通常在中心）
        const degreeA = props.edges.filter(e => e.head === (a as GraphNode).id || e.tail === (a as GraphNode).id).length;
        const degreeB = props.edges.filter(e => e.head === (b as GraphNode).id || e.tail === (b as GraphNode).id).length;
        return degreeB - degreeA;
      });
      
    queue.push(...children);
  }
  // 计算节点在树中的层级
  const getNodeLevel = (node: GraphNode) => {
    let level = 0;
    let currentNode = node;
    
    while (currentNode.id !== '0') {
      const parentEdge = props.edges.find(e => e.tail === currentNode.id);
      if (!parentEdge) break;
      
      const parent = props.nodes.find(n => n.id === parentEdge.head);
      if (!parent) break;
      
      level++;
      currentNode = parent;
    }
    
    return level;
  };
  
  // 2. 根据层次初始化位置
  orderedNodes.forEach((node, _index) => {
    if (node.id === '0' || node.id==='1-1-1-1') {
      node.x = centerX;
      node.y = centerY;
    } else {
      // 根据层次计算位置
      const level = getNodeLevel(node); // 计算节点在树中的深度
      const maxNodesPerLevel = orderedNodes.filter(n => getNodeLevel(n) === level).length;
      const nodeIndex = orderedNodes.filter(n => getNodeLevel(n) === level).indexOf(node);
      
      const angle = (2 * Math.PI * nodeIndex) / maxNodesPerLevel;
      const levelRadius = Math.min(width.value, height.value) * 0.3 / (level + 1);
      
      node.x = centerX + levelRadius * Math.cos(angle);
      node.y = centerY + levelRadius * Math.sin(angle);
    }
  });
  
  // 力导向迭代 (100次)
  for (let iter = 0; iter < 100; iter++) {
    // 1. 创建四叉树 (Barnes-Hut优化)
    const boundary = { 
      x: 0, 
      y: 0, 
      width: stageConfig.value.width*boundaryFactor, 
      height: stageConfig.value.height*boundaryFactor 
    };
    const tree = createQuadTree(boundary);
    
    // 插入所有节点到四叉树
    props.nodes.forEach(node => {
      if (node.id !== '0' && node.id!=='1-1-1-1') { // 根节点不参与斥力计算
        tree?.insert(node);
      }
    });
    
    // 2. 计算每个节点受到的力
    props.nodes.forEach(node => {
      if (node.id === '0'|| node.id==='1-1-1-1') return; // 根节点固定
      
      // 重置加速度
      node.vx = 0;
      node.vy = 0;
      
      // 斥力计算 (使用Barnes-Hut优化)
      tree?.computeRepulsion(node, params.theta, (node : GraphNode, centerX:number, centerY:number, mass:number, distance:number) => {
        const force = params.repulsion * mass / (distance * distance);
        node.vx = force * (node.x - centerX) / distance + (node.vx as number);
        node.vy = force * (node.y - centerY) / distance + (node.vy as number);
      });
      
      // 引力计算 (向连接节点)
      props.edges
        .filter(e => e.head === node.id || e.tail === node.id)
        .forEach(edge => {
          const otherId = edge.head === node.id ? edge.tail : edge.head;
          const other = props.nodes.find(n => n.id === otherId);
          if (other) {
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const targetDistance = 120; // 目标连接距离
              const force = params.attraction * (distance - targetDistance);
              node.vx = force * dx / distance + (node.vx  as number);
              node.vy = force * dy / distance + (node.vy as number);
            }
          }
        });
      
      // 中心引力 (防止节点飞散)
      const dxCenter = centerX - node.x;
      const dyCenter = centerY - node.y;
      const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
      
      if (distCenter > 0) {
        const maxDistance = Math.min(boundary.width, boundary.height) * 0.4;
        if (distCenter > maxDistance) {
          const force = params.centerAttraction * (distCenter - maxDistance);
          node.vx += force * dxCenter / distCenter;
          node.vy += force * dyCenter / distCenter;
        }
      }
    });
    
    // 3. 更新节点位置
    props.nodes.forEach(node => {
      if (node.id === '0') return; // 根节点固定
      
      // 限制最大速度
      const speed = Math.sqrt((node.vx as number) * (node.vx as number) + (node.vy as number) * (node.vy as number));
      if (speed > params.maxSpeed) {
        node.vx = params.maxSpeed * (node.vx as number) / speed;
        node.vy = params.maxSpeed * (node.vy as number) / speed;
      }
      
      // 应用冷却因子
      const coolingEffect = params.temperature / 100;
      node.x += node.vx as number * coolingEffect;
      node.y += node.vy as number * coolingEffect;
      
      // 应用阻尼
      node.vx = 0.6 * (node.vx as number);
      node.vy = 0.6 * (node.vy as number);
      
      // 边界约束
      const padding = 50;
      if (node.x < padding) node.x = padding;
      if (node.x > boundary.width - padding) node.x = boundary.width - padding;
      if (node.y < padding) node.y = padding;
      if (node.y > boundary.height - padding) node.y = boundary.height - padding;
    });
    
    // 4. 更新温度 (冷却系统)
    params.temperature *= params.coolingFactor;
    
    // 如果温度足够低，提前结束迭代
    if (params.temperature < 1) break;
  }
};

// 定义边界类型
interface Boundary {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 四叉树节点类 (修复栈溢出问题)
class QuadTreeNode {
  boundary: Boundary;
  capacity: number;
  nodes: GraphNode[];
  divided: boolean;
  mass: number;
  massX: number;
  massY: number;
  nw: QuadTreeNode | null = null;
  ne: QuadTreeNode | null = null;
  sw: QuadTreeNode | null = null;
  se: QuadTreeNode | null = null;

  constructor(boundary: Boundary, capacity: number = 4) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.nodes = [];
    this.divided = false;
    this.mass = 0;
    this.massX = 0;
    this.massY = 0;
  }

  /**
   * 插入节点到四叉树（修复递归问题）
   */
  insert(node: GraphNode): boolean {
    // 1. 检查节点是否在边界内
    if (!this.contains(node.x, node.y)) {
      return false;
    }

    // 2. 如果未分割且未满，直接添加
    if (!this.divided && this.nodes.length < this.capacity) {
      this.nodes.push(node);
      this.updateMass(node);
      return true;
    }

    // 3. 如果未分割但已满，先分割
    if (!this.divided) {
      // 添加安全机制：避免无限细分
      if (this.boundary.width < 1 || this.boundary.height < 1) {
        // 如果边界太小，不再细分，直接添加节点
        this.nodes.push(node);
        this.updateMass(node);
        return true;
      }
      this.subdivide();
    }

    // 4. 尝试插入子节点（使用非递归方式）
    const inserted = 
      (this.nw?.insert(node) || false) ||
      (this.ne?.insert(node) || false) ||
      (this.sw?.insert(node) || false) ||
      (this.se?.insert(node) || false);

    // 5. 如果插入子节点失败，添加到当前节点（安全回退）
    if (!inserted) {
      this.nodes.push(node);
      this.updateMass(node);
    }

    return true;
  }

  /**
   * 计算节点受到的斥力（添加边界检查）
   */
  computeRepulsion(
    node: GraphNode,
    theta: number,
    callback: (node: GraphNode, centerX: number, centerY: number, mass: number, distance: number) => void
  ): void {
    if (this.mass === 0) return;

    const centerX = this.massX / this.mass;
    const centerY = this.massY / this.mass;
    const dx = node.x - centerX;
    const dy = node.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 添加距离检查，避免除零错误
    if (distance === 0) return;

    // 如果满足条件，将区域视为一个整体计算斥力
    if (!this.divided || (this.boundary.width / distance < theta)) {
      callback(node, centerX, centerY, this.mass, distance);
      return;
    }

    // 递归检查子节点（添加空检查）
    this.nw?.computeRepulsion(node, theta, callback);
    this.ne?.computeRepulsion(node, theta, callback);
    this.sw?.computeRepulsion(node, theta, callback);
    this.se?.computeRepulsion(node, theta, callback);
  }

  /**
   * 检查点是否在当前边界内（使用容差处理边界情况）
   */
  contains(x: number, y: number): boolean {
    const b = this.boundary;
    const tolerance = 1e-5; // 浮点数容差
    
    return (
      x >= b.x - tolerance &&
      x <= b.x + b.width + tolerance &&
      y >= b.y - tolerance &&
      y <= b.y + b.height + tolerance
    );
  }

  /**
   * 细分当前区域（添加边界尺寸检查）
   */
  subdivide(): void {
    const b = this.boundary;
    const hw = b.width / 2;
    const hh = b.height / 2;

    // 添加边界尺寸检查
    if (hw < 1 || hh < 1) {
      // 边界太小，不再细分
      return;
    }

    // 创建四个子区域
    this.nw = new QuadTreeNode({ x: b.x, y: b.y, width: hw, height: hh });
    this.ne = new QuadTreeNode({ x: b.x + hw, y: b.y, width: hw, height: hh });
    this.sw = new QuadTreeNode({ x: b.x, y: b.y + hh, width: hw, height: hh });
    this.se = new QuadTreeNode({ x: b.x + hw, y: b.y + hh, width: hw, height: hh });

    this.divided = true;

    // 重新插入节点（使用非递归方式）
    const nodesToInsert = [...this.nodes];
    this.nodes = []; // 清空当前节点
    
    for (const node of nodesToInsert) {
      let inserted = false;
      
      if (this.nw?.insert(node)) inserted = true;
      if (!inserted && this.ne?.insert(node)) inserted = true;
      if (!inserted && this.sw?.insert(node)) inserted = true;
      if (!inserted && this.se?.insert(node)) inserted = true;
      
      // 如果无法插入任何子节点，保留在当前节点
      if (!inserted) {
        this.nodes.push(node);
      }
    }

    // 更新质量信息
    this.updateMassFromChildren();
  }

  /**
   * 更新质量信息
   */
  updateMass(node: GraphNode): void {
    const nodeMass = node.radius ? node.radius * node.radius : 1;
    this.mass += nodeMass;
    this.massX += node.x * nodeMass;
    this.massY += node.y * nodeMass;
  }

  /**
   * 从子节点更新质量信息
   */
  updateMassFromChildren(): void {
    this.mass = 0;
    this.massX = 0;
    this.massY = 0;
    
    const children = [this.nw, this.ne, this.sw, this.se];
    for (const child of children) {
      if (child) {
        this.mass += child.mass;
        this.massX += child.massX;
        this.massY += child.massY;
      }
    }
  }
}

/**
 * 创建四叉树（添加边界检查）
 */
const createQuadTree = (boundary: Boundary): QuadTreeNode | null => {
  // 确保边界有效
  if (boundary.width <= 0 || boundary.height <= 0) {
    console.error("Invalid boundary dimensions:", boundary);
    return null;
  }
  return new QuadTreeNode(boundary);
};

onMounted(()=>{
  //Stage config
  width.value = infoRef.value?.getBoundingClientRect().width as number
  height.value = (canvaContainer.value?.getBoundingClientRect().height || 0) - (infoRef.value?.getBoundingClientRect().height || 0) - 80  
  // console.log(canvaContainer.value?.getBoundingClientRect().height,infoRef.value?.getBoundingClientRect().height)

  stageConfig.value={
    width:width.value,
    height:height.value,
    scaleX:1,
    scaleY:1,
    draggable: true
  }

  //Layer: 网格层
  for (let y = 0; y < height.value*5; y += gridSize.value) {
    lines.value.push({
      points: [0, y, width.value*5, y],
      stroke: '#e0e0e0',
      strokeWidth: 2,
      dash: [2, 2]
    });
  }

  for (let x = 0; x < width.value*5; x += gridSize.value) {
    lines.value.push({
      points: [x, 0, x, height.value*5],
      stroke: '#e0e0e0',
      strokeWidth: 2,
      dash: [2, 2]
    });
  }
})

watch(props,()=>{
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
const width = ref<number>(0)
const height = ref<number>(0)

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
    x: 0,
    y: 0,
    radius: node.radius,
    fill: node.id.startsWith('2')?'#00D2FF':node.id.startsWith('3')?'#FF8000':'#00FFFF',
    stroke: 'black',
    strokeWidth: 2
  }
}

const textLayer = ref<Layer>()
const groupConfig = (node:GraphNode)=>{
  return {
    x : node.x,
    y : node.y,
    visible : node.showDescription
  }
}
const rectConfig = ref({
    x: 20,
    y: - 20,
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
})
const nameConfig = (node:GraphNode)=>{
  return {
    x : -node.radius,
    y : -10,
    text : node.name,
    fontSize : 20,
    align : 'center'  
  }
}
const descriptionConfig = (node : GraphNode)=>{
  return {
    x: 20,
    y: 20,
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

.stage-container{
  width : 938px;
  height : 650px;
}
</style>