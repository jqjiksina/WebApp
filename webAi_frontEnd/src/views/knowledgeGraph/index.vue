<template>
  <div class="knowledge-graph-container">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="stats">
        <el-tag type="success" size="small">节点: {{ optimizedData.nodes.length }}</el-tag>
        <el-tag type="success" size="small">关系: {{ optimizedData.links.length }}</el-tag>
        <el-tag type="info" size="small">
          <el-dropdown>
            <span class="custom-dropdown">布局引擎: {{ layoutEngine }}<el-icon style="height: 100%"><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="layoutEngine='force';renderGraph()">力导向布局</el-dropdown-item>
                <el-dropdown-item @click="layoutEngine='circular';renderGraph()">环形布局</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tag>
      </div>

      <!-- 搜索框 -->
      <div class="search-container">
        <el-select 
          v-model="selectedNodeId" 
          filterable 
          remote 
          clearable 
          reserve-keyword
          placeholder="搜索节点名称" 
          :remote-method="searchNodes"
          :loading="searchLoading"
          @change="onSearchNodeSelected"
          style="width: 250px"
        >
          <el-option
            v-for="node in filteredNodes"
            :key="node.id"
            :label="node.name"
            :value="node.id"
          />
        </el-select>
      </div>
      
      <el-button type="warning" @click="resetView" size="small">
        <el-icon><Refresh /></el-icon> 重置布局
      </el-button>
    </div>
    
    <!-- 图表容器 - 使用 Vue-ECharts -->
    <VChart
      ref="chartRef"
      class="chart-container"
      :option="chartOption"
      autoresize
      @click="handleChartClick"
    />
    
    <!-- 节点详情 -->
    <el-drawer v-model="nodeDrawerVisible" :title="selectedNode?.name" size="40%">
      <div v-if="selectedNode" style="padding:0 20px;">
        <el-descriptions title="节点信息" :column="1" border>
          <el-descriptions-item label="ID">{{ selectedNode.id }}</el-descriptions-item>
          <el-descriptions-item label="知识点">
            <div class="latex-name">{{ selectedNode.name }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="课程">{{ courseMap[selectedNode.type] }}</el-descriptions-item>
          <el-descriptions-item label="描述"><Markdown :value="selectedNode.definition"></Markdown></el-descriptions-item>
        </el-descriptions>
        
        <!-- 题目区域 -->
        <div v-if="selectedNode.problem && selectedNode.answer" class="answer-section">
          <h3 style="font-style: italic; margin-bottom: 1rem;">题目：</h3>
          <Markdown :value="selectedNode.problem"></Markdown>
          <div class="my-answer">
            <el-input 
              v-model="userAnswer" 
              placeholder="请输入您的答案..." 
              @keyup.enter="submitAnswer"
              clearable
              class="answer-input"
            />
          </div>
        </div>
        
        <!-- 答案区域 -->
        <div v-if="selectedNode.answer && answerSubmitted" class="answer-section">
          <p>{{ answerTrue ? "答案正确！" : "答案错误！" }}</p>
          <h3 style="font-style: italic; margin-bottom: 1rem;">答案：</h3>
          <Markdown :value="selectedNode.answer"></Markdown>
        </div>
      </div>
      <div v-else class="no-node-selected">
        <el-icon><InfoFilled /></el-icon>
        <p>未选择任何节点</p>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, shallowRef, watch, nextTick } from 'vue'
import { Refresh, ArrowDown, InfoFilled } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useKnowledgeGraphStore } from '@/store/knowledgeGraph'
import Markdown from '@/components/Markdown.vue'

type CourseType = 'all' | 'elec' | 'calculus' | 'pde'

const props = defineProps({
  filterCourse : String
})

const courseMap : {[key : string] : string}= {
  'pde' : "数理方程与特殊函数",
  'calculus' : "微积分",
  "elec" : "电磁场"
}

// 注册必要的 ECharts 组件
use([GraphChart, CanvasRenderer, TitleComponent, TooltipComponent, GridComponent])

// 性能优化数据结构
interface OptimizedGraphData {
  nodes: OptimizedNode[]
  links: OptimizedLink[]
  tempIdMap: Map<number, string>
}

interface OptimizedNode {
  id: string
  name: string
  t: string
  s: number
  x?: number
  y?: number
  c: string
}

interface OptimizedLink {
  s: string
  t: string
}

// 原始数据结构
interface KnowledgeNode {
  id: string
  name: string
  type: string
  definition: string
  parents?: string[]
  children?: string[]
  problem?: string
  answer?: string
}

// 状态变量
const layoutEngine = ref('force')
const focusMode = ref(false)
const focusedNodeId = ref<string | null>(null)
const graphData = shallowRef<KnowledgeNode[]>([])
const selectedNodeId = ref("")
const searchTerm = ref('')
const searchLoading = ref(false)
const filteredNodes = ref<KnowledgeNode[]>([])
const selectedNode = shallowRef<KnowledgeNode | null>(null)
const nodeDrawerVisible = ref(false)
const chartRef = shallowRef<InstanceType<typeof VChart> | null>(null)
const layoutAnimation = ref(true)

const userAnswer = ref("")
const answerSubmitted = ref(false)
const answerTrue = ref(false)

/**
 * 提交答案并将学生的该题数据保存好，需要访问后端接口，修改学生相关数据
 */
const submitAnswer = ()=>{
  answerSubmitted.value = true
  let afterAnswer = selectedNode.value?.answer?.replace(/\\\(/g,'').replace(/\\\)/g,'').replace(/ /g,'').replace(/\\\,/g,"")
    .replace(/\\text\{([^}]*)\}/g, '$1')
  console.log(afterAnswer)
  if (userAnswer.value === afterAnswer){
    answerTrue.value=true
  }else{
    answerTrue.value = false
  }
}

// 节点颜色映射
const nodeColors = {
  elec: '#5470C6',
  calculus: '#91CC75',
  pde: '#FAC858',
  other: '#EE6666'
}

const getNodeColor = (type?: string): string => {
  if (!type) return nodeColors.other
  return nodeColors[type as 'elec' | 'calculus' | 'pde'] || nodeColors.other
}

// 添加 renderGraph 功能
const renderGraph = () => {
  // 1. 触发布局动画
  layoutAnimation.value = true
  
  // 2. 强制图表更新
  const currentLayout = layoutEngine.value
  layoutEngine.value = 'none' // 临时设置为none
  nextTick(() => {
    layoutEngine.value = currentLayout
  })
}

// 计算优化后的图谱数据
const optimizedData = computed<OptimizedGraphData>(() => {
  const nodes: OptimizedNode[] = []
  const links: OptimizedLink[] = []
  const tempIdMap = new Map<number, string>()   // 从优化的number id索引到原string id索引的映射
  const idMap = new Map<string, number>()       // 从string id索引到优化后的id映射

  // 收集所有节点ID
  const allNodes = new Set<string>()
  for (let i = 0; i < graphData.value.length; i++) {
    const node = graphData.value[i]
    allNodes.add(node.id)
    idMap.set(node.id,i)      // 创建ID映射
    if (node.parents) for (let j = 0; j < node.parents.length; j++) allNodes.add(node.parents[j])
    if (node.children) for (let k = 0; k < node.children.length; k++) allNodes.add(node.children[k])
  }
  
  // 创建优化节点
  let index = 0
  for (const id of allNodes) {
    const dataNode = findNode(id)
    const type = dataNode?.type || 'other'
    
    // 计算节点大小
    const connections = [
      ...(dataNode?.parents || []),
      ...(dataNode?.children || [])
    ].length
    const size = Math.max(20, Math.min(60, 25 + connections * 3))
    
    nodes.push({
      id: String(idMap.get(id)),
      name: dataNode?.name || id,  // name限制长度
      t: type.substring(0, 3),
      s: size,
      c: getNodeColor(type)
    })
    
    tempIdMap.set(Number(idMap.get(id)), id)
    index++
  }
  
  // 创建优化链接
  for (let i = 0; i < graphData.value.length; i++) {
    const node = graphData.value[i]
    const nodeIdNum = idMap.get(node.id) || 0
    
    // 处理父节点关系
    if (node.parents) {
      for (let j = 0; j < node.parents.length; j++) {
        const parentId = node.parents[j]
        const parentIdNum = idMap.get(parentId)
        if (parentIdNum !== undefined) {
          links.push({
            s: String(parentIdNum),
            t: String(nodeIdNum)
          })
        }
      }
    }
    
    // 处理子节点关系
    if (node.children) {
      for (let k = 0; k < node.children.length; k++) {
        const childId = node.children[k]
        const childIdNum = idMap.get(childId)
        if (childIdNum !== undefined) {
          links.push({
            s: String(nodeIdNum),
            t: String(childIdNum)
          })
        }
      }
    }
  }
  
  return { nodes, links, tempIdMap }
})

// 图表配置
const chartOption = computed(() => {
  const { nodes, links } = optimizedData.value
  return {
    title: {
      text: '知识图谱',
      top: 10,
      left: 'center',
      textStyle: {
        fontSize: 18,
        color: "#ab8f00"
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      borderColor: '#555',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      },
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const node = params.data
          const originalNode = findNode(params.data.id)
          return `
            <div style="font-size:14px;font-weight:bold;color:${node.c};margin-bottom:5px">
              ${originalNode?.name || node.name}
            </div>
            <div>ID: ${params.data.id}</div>
          `
        }
        return `<div style="font-size:12px">${params.source} → ${params.target}</div>`
      }
    },
    animation: layoutAnimation.value,
    animationThreshold: 2000,
    series: [{
      type: 'graph',
      layout: layoutEngine.value,
      roam: true,
      zoom: 1,
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: [0, 8],
      lineStyle: {
        color: '#ffe1ce',
        width: 1,
        curveness: 0.1
      },
      emphasis: {
        scale: false,
        lineStyle: {
          width: 2,
          color: '#aaa'
        },
        focus : "adjacency"
      },
      data: nodes.map(node => ({
        id: node.id,
        name: node.name,
        symbolSize: node.s,
        x: node.x,
        y: node.y,
        itemStyle: {
          color: node.c
        },
        label: {
          show: nodes.length < 500,
          color: '#eee',
          fontSize: 11,
          backgroundColor: 'rgba(30, 30, 30, 0.7)',
          padding: [3, 5],
          borderRadius: 3,
          distance: 5
        }
      })),
      links: links.map(link => ({
        source: link.s,
        target: link.t
      })),
      force: {
        repulsion: 400,
        gravity: 0.03,
        edgeLength: 120,
        friction: 0.7,
        layoutAnimation: layoutAnimation.value
      },
      circular: {
        rotateLabel: false
      }
    }]
  }
})

// 图表点击事件处理
const handleChartClick = (params: any) => {
  console.log("click!")
  if (params.dataType === 'node') {
    const nodeId = params.data.id 

    // 查找原始节点数据
    const { tempIdMap } = optimizedData.value
    const originalId = tempIdMap.get(parseInt(nodeId))
    if (!originalId) return
    
    const originalNode = findNode(originalId)
    if (originalNode) {
      nodeDrawerVisible.value = true
      selectedNode.value = originalNode
    }
  }
}

// 查找节点函数
const findNode = (id: string): KnowledgeNode | undefined => {
  for (let i = 0; i < graphData.value.length; i++) {
    if (graphData.value[i].id === id) {
      return graphData.value[i]
    }
  }
  return undefined
}

// 搜索节点
const searchNodes = (query: string) => {
  searchTerm.value = query
  if (!query) {
    filteredNodes.value = []
    return
  }
  
  searchLoading.value = true
  const lowerQuery = query.toLowerCase()
  
  filteredNodes.value = graphData.value.filter(node => 
    node.name.toLowerCase().includes(lowerQuery)
  )
  
  searchLoading.value = false
}

// 节点选择处理
const onSearchNodeSelected = (nodeId: string) => {
  if (!nodeId) return
  
  const node = graphData.value.find(n => n.id === nodeId)
  if (!node) return
  
  // 设置选中节点
  selectedNode.value = node
  
  // 在图表中定位节点
  const optimizedId = findOptimizedId(nodeId)
  if (optimizedId !== null) {
    focusNode(optimizedId)
  }
  
  // 打开抽屉
  nodeDrawerVisible.value = true
}

// 根据原始ID查找优化后的节点ID
const findOptimizedId = (originalId: string): string | null => {
  const { tempIdMap } = optimizedData.value
  for (const [key, value] of tempIdMap.entries()) {
    if (value === originalId) {
      return String(key)
    }
  }
  return null
}

// 聚焦节点动画
const focusNode = (nodeId: string) => {
  if (!chartRef.value) return
  
  const chartInstance = chartRef.value
  // console.log("focous!",chartInstance.getOption())
  
  const nodes = optimizedData.value.nodes
  const nodeIndex = nodes.findIndex(n => n.id === nodeId)
  if (nodeIndex === -1) return
  
  // 延迟执行确保高亮显示
  setTimeout(() => {
    chartInstance.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: nodeIndex
    })
  }, 200)
}

// 重置视图
const resetView = () => {
  if (!chartRef.value) return
  
  chartRef.value.dispatchAction({
    type: 'geoRoam',
    animation: {
      duration: 800,
      easing: 'quadraticOut'
    },
    center: [1000, 1000],
    zoom: 1
  })
}

// 组件挂载时初始化
onMounted(() => {
  graphData.value = useKnowledgeGraphStore().getKnowledgeGraph(props.filterCourse as CourseType)
  useKnowledgeGraphStore().printKnowledgeGraph(props.filterCourse as CourseType)
})

// 监听抽屉关闭
watch(nodeDrawerVisible, (visible) => {
  if (!visible) {
    console.log("close drawer")
    answerSubmitted.value = false
    answerTrue.value = false
    resetView()
  }
})

watch(props,(props)=>{
  graphData.value = useKnowledgeGraphStore().getKnowledgeGraph(props.filterCourse as CourseType)
  useKnowledgeGraphStore().printKnowledgeGraph(props.filterCourse as CourseType)
})
</script>

<style scoped>
@import '@/assets/chart.css';
.knowledge-graph-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f3ebeb;
  font-family: 'Segoe UI', system-ui, sans-serif;
  overflow: hidden;
}

.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: rgba(40, 40, 40, 0.9);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;  
}

.stats {
  display: flex;
  gap: 12px;
}

.chart-container {
  flex: 1;
  background: var(--chart-background);
  min-height: 500px;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 15px;
}

.problem-section, .answer-section {
  margin-top: 25px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  color : black;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.problem-content, .answer-content {
  font-size: 16px;
  line-height: 1.6;
  overflow-x: auto;
  padding: 10px 5px;
}

.katex-display {
  overflow-x: auto;
  overflow-y: hidden;
}

.latex-error {
  color: #f56c6c;
  background-color: #fef0f0;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
}

.latex-name {
  padding: 5px 0;
}

@media (max-width: 768px), (max-height: 600px) {
  .el-tag {
    font-size: 10px;
    padding: 0 6px;
  }
}
</style>