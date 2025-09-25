<!-- <template>
    <div class="integral-container">
        <el-card style="height: 100%;" body-style="height: 100%;">
            <template #header>微积分知识图谱</template>
            <Canvas :nodes="nodes" :edges="edges"></Canvas>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';
import Canvas from '../canvas.vue';
import { useKnowledgeGraphStore } from '@/store/knowledgeGraph';
const knowledgeGraphStore = useKnowledgeGraphStore()
const vanillaGraph = ref()
onMounted(()=>{
    vanillaGraph.value = knowledgeGraphStore.getKnowledgeGraph('calculus')
    knowledgeGraphStore.printKnowledgeGraph()
    console.log("vanillaGraph: ",JSON.stringify(vanillaGraph.value,null,2))
})

const nodes : Ref<GraphNode[]>= ref([
    {
        id : '0',
        description : "root",
        relativeNode : ['','','','',''],
        x : 0, y : 0, radius : 30,
        showDescription: false,
        name : '微积分'
    },{
        id : '1',
        description : "node 1",
        relativeNode : ['','','','',''],
        x : 0, y : 20, radius : 30,
        showDescription: false,
        name : '积分'
    },{
        id : '2',
        description : "node 2",
        relativeNode : ['','','','',''],
        x : 0, y : 40, radius : 30,
        showDescription: false,
        name : "微分"
    },{
        id : '3',
        description : "node 3",
        relativeNode : ['','','','',''],
        x : 0, y : 40, radius : 30,
        showDescription: false,
        name : '不定积分'
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
</style> -->

<template>
    <div class="knowledge-graph-container">
      <!-- 标题和控制面板 -->
      <div class="graph-header">
        <h2>全课程知识图谱</h2>
        <div class="controls">
          <el-select v-model="layoutAlgorithm" @change="refreshGraph">
            <el-option label="力导向布局" value="force" />
            <el-option label="环形布局" value="circular" />
            <el-option label="放射状布局" value="radial" />
          </el-select>
          
          <el-button @click="centerGraph" type="primary">
            重置视图
          </el-button>
          
          <el-switch
            v-model="showLabels"
            active-text="显示标签"
            inactive-text="隐藏标签"
            @change="updateOptions"
          />
        </div>
      </div>
      
      <!-- 图表容器 -->
      <v-chart
        ref="graphChart"
        class="chart"
        :option="chartOption"
        :initOptions="initOptions"
        :autoresize="true"
        @click="handleNodeClick"
        @mouseover="handleNodeMouseOver"
        @mouseout="handleNodeMouseOut"
      />
      
      <!-- 节点详情弹出层 -->
      <el-dialog :title="selectedNode?.name" v-model="detailVisible" width="50%">
        <div v-if="selectedNode">
          <h3>定义</h3>
          <p>{{ selectedNode.description || '暂无定义信息' }}</p>
          
          <h3>相关知识点</h3>
          <el-row :gutter="10">
            <el-col :span="8" v-for="related in relatedNodes" :key="related.id">
              <el-tag type="info" @click="navigateToNode(related.id)">
                {{ related.name }}
              </el-tag>
            </el-col>
          </el-row>
          
          <el-divider />
          
          <el-button @click="detailVisible = false">
            关闭
          </el-button>
        </div>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { use } from 'echarts/core';
  import { CanvasRenderer } from 'echarts/renderers';
  import { GraphChart } from 'echarts/charts';
  import {
    TooltipComponent,
    LegendComponent,
    ToolboxComponent
  } from 'echarts/components';
  import VChart, { THEME_KEY } from 'vue-echarts';
  
  // 注册必要组件
  use([
    CanvasRenderer,
    GraphChart,
    TooltipComponent,
    LegendComponent,
    ToolboxComponent
  ]);
  
  // 知识点数据结构
  const nodes = ref([
    { id: '0', name: '微积分', category: 0, description: '高等数学的核心分支' },
    { id: '1', name: '微分学', category: 1, description: '研究变化率和局部性质的数学分支' },
    { id: '2', name: '积分学', category: 1, description: '研究累加和总体性质的数学分支' },
    { id: '3', name: '导数', category: 2, description: '函数在某点的变化率' },
    { id: '4', name: '微分', category: 2, description: '函数的局部变化量' },
    { id: '5', name: '不定积分', category: 2, description: '导数的逆运算' },
    { id: '6', name: '定积分', category: 2, description: '函数在区间上的累积变化' },
    { id: '7', name: '牛顿-莱布尼茨公式', category: 3, description: '连接微分与积分的重要公式' },
  ]);
  
  // 知识点关系
  const edges = ref([
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '1', target: '3' },
    { source: '1', target: '4' },
    { source: '2', target: '5' },
    { source: '2', target: '6' },
    { source: '3', target: '7' },
    { source: '4', target: '7' },
    { source: '5', target: '7' },
    { source: '6', target: '7' },
  ]);
  
  // 知识类别
  const categories = ref([
    { name: '学科' },
    { name: '分支' },
    { name: '基础概念' },
    { name: '定理公式' }
  ]);
  
  // 图表选项
  const chartOption = ref(null);
  const layoutAlgorithm = ref('force');
  const showLabels = ref(true);
  const selectedNode = ref(null);
  const detailVisible = ref(false);
  const graphChart = ref(null);
  
  // 初始化配置
  const initOptions = ref({ renderer: 'canvas' });
  
  // 计算相关节点
  const relatedNodes = computed(() => {
    if (!selectedNode.value) return [];
    
    const relations = edges.value
      .filter(e => e.source === selectedNode.value.id || e.target === selectedNode.value.id)
      .map(e => e.source === selectedNode.value.id ? e.target : e.source);
    
    return nodes.value
      .filter(n => relations.includes(n.id) && n.id !== selectedNode.value.id);
  });
  
  // 生成图表配置
  const generateChartOption = () => {
    return {
      tooltip: {
        triggerOn: 'none',
        position: 'top',
        formatter: params => {
          if (params.dataType === 'node') {
            return `<b>${params.data.name}</b><br>${params.data.categoryName}`;
          }
          return '';
        }
      },
      legend: [{
        data: categories.value.map(c => c.name),
        selectedMode: 'single',
      }],
      animationDuration: 1500,
      animationEasingUpdate: 'quinticInOut',
      series: [{
        name: '知识图谱',
        type: 'graph',
        layout: layoutAlgorithm.value,
        symbolSize: 50,
        roam: true,
        focusNodeAdjacency: true,
        categories: categories.value,
        edgeSymbol: ['circle', 'arrow'],
        edgeSymbolSize: [4, 8],
        label: {
          show: showLabels.value,
          position: 'right',
          formatter: '{b}',
          fontSize: 14
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3
        },
        emphasis: {
          scale: true,
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          },
          lineStyle: {
            width: 5
          }
        },
        data: nodes.value.map(node => ({
          ...node,
          category: node.category,
          categoryName: categories.value[node.category]?.name || '其他',
          symbolSize: node.id === '0' ? 70 : 50,
          itemStyle: {
            color: getCategoryColor(node.category)
          }
        })),
        links: edges.value.map(edge => {
          return {
            ...edge,
            symbol: ['none', 'arrow'],
            lineStyle: {
              width: 2,
              color: getEdgeColor(edge)
            }
          };
        }),
        force: layoutAlgorithm.value === 'force' ? {
          repulsion: 400,
          gravity: 0.05,
          edgeLength: [100, 200],
          layoutAnimation: true
        } : null,
      }],
      toolbox: {
        show: true,
        feature: {
          saveAsImage: { 
            title: '保存图像',
            pixelRatio: 2 
          },
          restore: { title: '重置视图' },
          dataView: { 
            title: '数据视图', 
            readOnly: true,
            optionToContent: () => {
              return `<pre>${JSON.stringify(nodes.value, null, 2)}</pre>`;
            }
          }
        }
      }
    };
  };
  
  // 类别颜色映射
  const getCategoryColor = (category) => {
    const colors = [
      '#5470c6', // 蓝色 - 学科
      '#91cc75', // 绿色 - 分支
      '#fac858', // 黄色 - 基础概念
      '#ee6666', // 红色 - 定理公式
      '#73c0de', // 浅蓝 - 其他
    ];
    return colors[category] || colors[4];
  };
  
  // 边线颜色
  const getEdgeColor = (edge) => {
    const sourceNode = nodes.value.find(n => n.id === edge.source);
    if (!sourceNode) return '#aaa';
    return getCategoryColor(sourceNode.category);
  };
  
  // 初始化图表
  const initChart = () => {
    chartOption.value = generateChartOption();
    
    // 添加自动居中功能
    setTimeout(() => {
      centerGraph();
    }, 500);
  };
  
  // 刷新图表
  const refreshGraph = () => {
    chartOption.value = generateChartOption();
  };
  
  // 更新选项
  const updateOptions = () => {
    chartOption.value = {
      ...chartOption.value,
      series: [{
        ...chartOption.value.series[0],
        label: {
          show: showLabels.value
        }
      }]
    };
  };
  
  // 居中显示图表
  const centerGraph = () => {
    if (graphChart.value && graphChart.value.getEchartsInstance()) {
      const echartsInstance = graphChart.value.getEchartsInstance();
      echartsInstance.dispatchAction({
        type: 'dataZoom',
        start: 0,
        end: 100
      });
      
      echartsInstance.dispatchAction({
        type: 'restore'
      });
    }
  };
  
  // 节点点击事件
  const handleNodeClick = (params) => {
    if (params.dataType === 'node') {
      selectedNode.value = params.data;
      detailVisible.value = true;
      
      // 高亮相关节点
      if (graphChart.value) {
        const echartsInstance = graphChart.value.getEchartsInstance();
        echartsInstance.dispatchAction({
          type: 'focusNodeAdjacency',
          dataIndex: params.dataIndex
        });
      }
    }
  };
  
  // 节点悬停事件
  const handleNodeMouseOver = (params) => {
    if (params.dataType === 'node' && graphChart.value) {
      const echartsInstance = graphChart.value.getEchartsInstance();
      echartsInstance.dispatchAction({
        type: 'highlight',
        dataIndex: params.dataIndex
      });
    }
  };
  
  // 节点离开事件
  const handleNodeMouseOut = () => {
    if (graphChart.value) {
      const echartsInstance = graphChart.value.getEchartsInstance();
      echartsInstance.dispatchAction({
        type: 'downplay'
      });
    }
  };
  
  // 导航到相关节点
  const navigateToNode = (nodeId) => {
    if (graphChart.value) {
      const echartsInstance = graphChart.value.getEchartsInstance();
      const index = nodes.value.findIndex(n => n.id === nodeId);
      
      if (index !== -1) {
        // 滚动到节点
        echartsInstance.dispatchAction({
          type: 'focusNodeAdjacency',
          dataIndex: index
        });
        
        // 选中该节点
        selectedNode.value = nodes.value[index];
        detailVisible.value = true;
      }
    }
  };
  
  onMounted(() => {
    initChart();
  });
  
  // 监听数据变化
  watch([nodes, edges], () => {
    refreshGraph();
  });
  </script>
  
  <style scoped>
  .knowledge-graph-container {
    width: 100%;
    height: 80vh;
    display: flex;
    flex-direction: column;
  }
  
  .graph-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
  }
  
  .controls {
    display: flex;
    gap: 15px;
    align-items: center;
  }
  
  .chart {
    width: 100%;
    flex: 1;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-dialog) {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  
  :deep(.el-dialog__header) {
    padding: 20px;
    border-bottom: 1px solid #eee;
  }
  
  :deep(.el-dialog__body) {
    padding: 20px;
  }
  
  :deep(.el-tag) {
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  :deep(.el-tag:hover) {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  </style>