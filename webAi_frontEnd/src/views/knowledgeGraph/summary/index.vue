<template>
    <div class="knowledge-graph-container">
      <!-- 控制面板 -->
      <div class="control-panel">
        <el-button type="primary" @click="toggleFullscreen" size="small">
          <el-icon><FullScreen /></el-icon>
          {{ isFullscreen ? '退出全屏' : '进入全屏' }}
        </el-button>
        
        <div class="stats">
          <el-tag type="success" size="small">节点: {{ optimizedData.nodes.length }}</el-tag>
          <el-tag :type="focusMode ? 'warning' : 'info'" size="small">
            {{ focusMode ? '聚焦模式' : '全景模式' }}
          </el-tag>
          <el-tag type="info" size="small">
            布局引擎: {{ layoutEngine }}
          </el-tag>
        </div>
        
        <el-button type="warning" @click="resetView" size="small">
          <el-icon><Refresh /></el-icon> 重置布局
        </el-button>
      </div>
      
      <!-- 图表容器 -->
      <div ref="chartContainer" class="chart-container">
        <div v-if="loading" class="loading-overlay">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <p>知识图谱加载中...</p>
        </div>
      </div>
      
      <!-- 节点详情 -->
      <el-drawer v-model="nodeDrawerVisible" :title="selectedNode?.name" size="40%">
        <!-- 节点详情内容不变 -->
      </el-drawer>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, nextTick, shallowRef} from 'vue'
  import { FullScreen, Refresh, Loading } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
import { useKnowledgeGraphStore } from '@/store/knowledgeGraph'
  
  // 1. 性能优化数据结构
  interface OptimizedGraphData {
    nodes: OptimizedNode[]
    links: OptimizedLink[]
  }
  
  interface OptimizedNode {
    id: string
    name: string // 名称缩写
    t: string // 类型缩写
    s: number // 大小
    x?: number
    y?: number
    c: string // 颜色
  }
  
  interface OptimizedLink {
    s: string // 源节点ID缩写
    t: string // 目标节点ID缩写
  }
  
  // 2. 性能优化变量
  const chartContainer = shallowRef<HTMLElement | null>(null) // 浅层引用
  const chartInstance = shallowRef<echarts.ECharts | null>(null)
  const layoutEngine = ref<string>('force')
//   const isLoading = ref(false)
  const loading = ref(false)
  const initialRender = ref(true)
  const layoutAnimation = ref(false) // 初始布局时不使用动画
  
  // 3. 响应式变量
  const isFullscreen = ref(false)
  const focusMode = ref(false)
  const focusedNodeId = ref<string | null>(null)
  const selectedNode = ref<KnowledgeNode | null>(null)
  const nodeDrawerVisible = ref(false)
  
  // 4. 原始数据结构（实际使用中替换为您的JSON数据）
  interface KnowledgeNode {
    id: string
    name: string
    type: string
    definition: string
    parents?: string[]
    children?: string[]
  }
  
  // 5. 优化后的图谱数据（计算属性）
  const optimizedData = computed<OptimizedGraphData>(() => {
    // 创建所有节点的优化版本
    const nodes: OptimizedNode[] = []
    const links: OptimizedLink[] = []
    
    // 收集所有节点
    const allNodes = new Set<string>()
    
    // 性能优化：使用 for 循环替代 forEach
    for (let i = 0; i < graphData.value.length; i++) {
      const node = graphData.value[i]
      allNodes.add(node.id)
      if (node.parents) for (let j = 0; j < node.parents.length; j++) allNodes.add(node.parents[j])
      if (node.children) for (let k = 0; k < node.children.length; k++) allNodes.add(node.children[k])
    }
    
    // 创建优化节点
    const idMap = new Map<string, number>()
    let counter = 0
    allNodes.forEach(id => idMap.set(id, counter++))
    
    const tempIdMap = new Map<number, string>()
    
    // 创建优化节点
    // let index = 0
    for (const id of allNodes) {
      const dataNode = findNode(id)
      const type = dataNode?.type || 'other'
      
      // 计算节点大小（根据连接数）
      const connections = [
        ...(dataNode?.parents || []),
        ...(dataNode?.children || [])
      ].length
      
      const size = Math.max(20, Math.min(60, 25 + connections * 3))
      
      nodes.push({
        id: String(idMap.get(id)),
        name: dataNode?.name.substring(0, 15) || id.substring(0, 8),
        t: type.substring(0, 3),
        s: size,
        c: getNodeColor(type)
      })
      
      tempIdMap.set(Number(idMap.get(id)), id)
    }
    
    // 创建优化连接
    for (let i = 0; i < graphData.value.length; i++) {
      const node = graphData.value[i]
      const nodeIdNum = idMap.get(node.id) || 0
      
      // 处理父节点关系
      if (node.parents?.length) {
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
      if (node.children?.length) {
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
  
  // 6. 模拟数据（实际应用中替换为您的JSON导入）
  const graphData = shallowRef<KnowledgeNode[]>(generateLargeDataset(300)) // 生成300个节点的测试数据
  
  // 生成大规模测试数据的函数
  function generateLargeDataset(count: number): KnowledgeNode[] {
    const types = ['elec', 'calculus', 'pde', 'other']
    const nodes: KnowledgeNode[] = []
    
    // 创建根节点
    nodes.push({
      id: '0',
      name: '知识图谱根节点',
      type: 'elec',
      definition: '整个知识图谱的起点',
      children: []
    })
    
    // 生成数据节点
    for (let i = 1; i < count; i++) {
      const nodeType = types[Math.floor(Math.random() * types.length)]
    //   const level = Math.floor(Math.log(i) / Math.log(3))
      
      nodes.push({
        id: String(i),
        name: `${nodeType}-节点-${i}`,
        type: nodeType,
        definition: `这是${nodeType}类型的第${i}个节点，包含数学或科学公式`,
        parents: [],
        children: []
      })
    }
    
    // 创建层级关系
    for (let i = 1; i < count; i++) {
      const parentId = Math.floor(Math.pow(3, Math.floor(Math.log(i) / Math.log(3)) - 1))
      if (nodes[parentId] && i !== parentId) {
        nodes[parentId].children = nodes[parentId].children || []
        nodes[parentId].children.push(String(i))
        
        nodes[i].parents = nodes[i].parents || []
        nodes[i].parents?.push(String(parentId))
      }
    }
    
    return nodes
  }
  
  // 7. 容器样式计算（同之前）
//   const containerStyle = computed<CSSProperties>(() => ({ ... }))
  
  // 8. 查找节点函数
  const findNode = (id: string): KnowledgeNode | undefined => {
    // 使用简单循环而非数组方法提高性能
    for (let i = 0; i < graphData.value.length; i++) {
      if (graphData.value[i].id === id) {
        return graphData.value[i]
      }
    }
    return undefined
  }
  
  // 9. 节点颜色映射
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
  
  // 10. 渲染函数（性能优化版）
  const renderGraph = async () => {
    if (!chartContainer.value) return
    
    loading.value = true
    
    try {
      // 请求空闲时间进行渲染
      if ('requestIdleCallback' in window) {
        await new Promise(resolve => {
          (window as any).requestIdleCallback(resolve, { timeout: 100 })
        })
      } else {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // 清除现有实例
      if (chartInstance.value) {
        chartInstance.value.dispose()
        chartInstance.value = null
      }
      
      // 创建新实例
      chartInstance.value = echarts.init(chartContainer.value)
      
      // 准备图表数据
      const { nodes, links } = optimizedData.value
      
      // 计算初始布局
      await calculateInitialLayout(nodes)
      
      // 图表配置
      const option = getChartOption(nodes, links)
      
      // 应用配置
      chartInstance.value.setOption(option, { replaceMerge: ['series'] })
      
      // 添加事件监听器
      addChartEvents()
      
      // 初始渲染后启用布局动画
      if (initialRender.value) {
        initialRender.value = false
        layoutAnimation.value = true
      }
    } catch (error) {
      console.error('渲染错误:', error)
    } finally {
      loading.value = false
    }
  }
  
  // 11. 初始布局计算（Web Worker）
  const calculateInitialLayout = async (nodes: OptimizedNode[]) => {
    // 使用简单算法计算初始位置
    const centerX = 1000
    const centerY = 1000
    const radius = 900
    
    for (let i = 0; i < nodes.length; i++) {
      const angle = (i * 2 * Math.PI) / nodes.length
      nodes[i].x = centerX + radius * Math.cos(angle)
      nodes[i].y = centerY + radius * Math.sin(angle)
    }
    
    return new Promise(resolve => setTimeout(resolve, 10))
  }
  
  // 12. 获取图表配置
  const getChartOption = (nodes: OptimizedNode[], links: OptimizedLink[]) => {
    return {
      title: {
        text: '知识图谱',
        subtext: `节点: ${nodes.length}, 关系: ${links.length}`,
        top: 10,
        left: 'center',
        textStyle: {
          fontSize: 18
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
                ${originalNode?.name || node.n}
              </div>
              <div>ID: ${params.data.id}</div>
            `
          }
          return `<div style="font-size:12px">${params.source} → ${params.target}</div>`
        }
      },
      animation: layoutAnimation.value,
      animationThreshold: 2000, // 大于2000个节点时关闭动画
      series: [{
        type: 'graph',
        layout: layoutEngine.value,
        roam: true,
        zoom: 1,
        focusNodeAdjacency: true,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        lineStyle: {
          color: 'rgba(150, 150, 150, 0.3)',
          width: 1,
          curveness: 0.1
        },
        emphasis: {
          scale: false,
          lineStyle: {
            width: 2,
            color: '#aaa'
          }
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
            show: nodes.length < 500, // 节点过多时不显示标签
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
          repulsion: 400, // 降低计算复杂度
          gravity: 0.03,
          edgeLength: 120,
          friction: 0.7, // 更高的摩擦系数，更快停止
          layoutAnimation: layoutAnimation.value
        },
        circular: {
          rotateLabel: false
        }
      }]
    }
  }
  
  // 13. 添加图表事件
  const addChartEvents = () => {
    if (!chartInstance.value) return
    
    // 优化性能：使用节流的事件处理
    let lastClickTime = 0
    const clickHandler = (params: any) => {
      const now = Date.now()
      if (now - lastClickTime < 300) return // 防止快速连续点击
      lastClickTime = now
      
      if (params.dataType === 'node') {
        const nodeId = params.data.id
        focusedNodeId.value = nodeId
        focusMode.value = true
        
        const originalNode = findNode(nodeId)
        if (originalNode) {
          selectedNode.value = originalNode
          nodeDrawerVisible.value = true
        }
      }
    }
    
    chartInstance.value.on('click', clickHandler)
    
    // 添加双击事件返回全景模式
    chartInstance.value.getZr().on('dblclick', () => {
      focusMode.value = false
      renderGraph()
    })
    
    // 添加缩放事件
    let lastZoomTime = 0
    chartInstance.value.on('datazoom', () => {
      const now = Date.now()
      if (now - lastZoomTime < 100) return // 100ms内不重复触发
      lastZoomTime = now
    })
  }
  
  // 14. 重置视图
  const resetView = () => {
    layoutAnimation.value = false
    layoutEngine.value = 'force'
    focusMode.value = false
    renderGraph()
  }
  
  // 15. 切换全屏模式
  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
    nextTick(() => renderGraph())
  }
  
  // 16. 初始化
  onMounted(() => {
    graphData.value = useKnowledgeGraphStore().getKnowledgeGraph()
    // 延迟初始渲染
    setTimeout(() => {
      renderGraph()
      window.addEventListener('resize', handleResize)
    }, 100)
  })
  
  // 17. 窗口大小调整处理
  const handleResize = () => {
    if (!chartInstance.value) return
    
    // 节流处理调整大小
    (window as any).resizeTimer = setTimeout(() => {
        if (chartInstance.value) {
            chartInstance.value.resize()
        }
    }, 300)
    clearTimeout((window as any).resizeTimer)
  }
  
  // 18. 清理
  onUnmounted(() => {
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }
    window.removeEventListener('resize', handleResize)
  })
  </script>
  
  <style scoped>
  .knowledge-graph-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #1a1a1a;
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
    background: #1e1e1e;
    position: relative;
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(30, 30, 30, 0.7);
    z-index: 100;
    color: #aaa;
  }
  
  .loading-icon {
    font-size: 48px;
    animation: rotate 1.5s linear infinite;
    margin-bottom: 15px;
    color: #409eff;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .el-button {
    transition: all 0.2s;
    padding: 7px 12px;
  }
  
  .el-button:hover {
    transform: translateY(-2px);
  }
  
  /* 高性能CSS，避免昂贵的属性 */
  .chart-container, .loading-overlay, .el-button {
    will-change: transform;
    transform: translateZ(0);
  }
  
  /* 低端设备降级 */
  @media (max-width: 768px), (max-height: 600px) {
    .chart-container {
      /* 移动设备关闭部分效果 */
    }
    
    .el-tag {
      font-size: 10px;
      padding: 0 6px;
    }
  }
  </style>