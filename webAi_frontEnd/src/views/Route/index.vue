<template>
  <div class="learning-path-container">
    <!-- 学生目录侧边栏 -->
    <div class="student-directory">
      <h2>学生目录</h2>
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索学生学号或姓名"
          class="search-input"
        >
        <i class="fas fa-search search-icon"></i>
      </div>
      
      <div class="student-list">
        <div 
          v-for="student in filteredStudents" 
          :key="student.sid"
          class="student-item"
          :class="{ active: currentStudent?.sid === student.sid }"
          @click="selectStudent(student)"
        >
          <div class="student-id">{{ student.sid }}</div>
          <div class="student-degree">
            掌握度: {{ student.degree }}
            <div class="degree-bar">
              <div 
                class="degree-progress" 
                :style="{ width: `${student.degree}%` }"
              ></div>
            </div>
          </div>
          <div class="student-path">
            <span class="path-label">学习路径:</span>
            <div class="path-tags">
              <span 
                v-for="(nodeId, index) in student.route.slice(0, 3)" 
                :key="index"
                class="path-tag"
              >
                {{ getNodeName(nodeId) || nodeId }}
              </span>
              <span v-if="student.route.length > 3" class="path-tag">+{{ student.route.length - 3 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <div class="header">
        <h1>个性化学习路径推荐</h1>
        <div v-if="currentStudent" class="current-student-info">
          <span class="student-id">学号: {{ currentStudent.sid }}</span>
          <span class="student-degree">掌握度: {{ currentStudent.degree }}</span>
        </div>
      </div>
      
      <div class="chart-container">
        <v-chart class="chart" :option="treeOption" autoresize @click="onChartClick"/>
      </div>
      
      <div class="node-details" v-if="selectedNode">
        <div class="status-tag" :class="selectedNode.status">
          {{ statusLabels[selectedNode.status] }}
        </div>
        <h3>{{ getNodeName(selectedNode.id) || selectedNode.id }}</h3>
        <div class="progress-section">
          <div class="progress-bar">
            <div 
              class="progress-value" 
              :style="{ width: `${selectedNode.progress}%` }"
            ></div>
          </div>
          <span>{{ selectedNode.progress }}% 完成度</span>
        </div>
        <div class="description">
          <Markdown :value="getNodeDefinition(selectedNode.id) || '暂无详细描述'"/>
        </div>
        <div class="node-meta">
          <div class="meta-item">
            <i class="fas fa-layer-group"></i>
            <span>深度: {{ selectedNode.depth }}</span>
          </div>
          <div class="meta-item">
            <i class="far fa-clock"></i>
            <span>预计耗时: {{ selectedNode.timeCost }}分钟</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-book"></i>
            <span>类型: {{ getNodeType(selectedNode.id) || '未知' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import VChart from 'vue-echarts';
import { useIndividualStore } from '@/store/individual';
import { useKnowledgeGraphStore } from '@/store/knowledgeGraph';

// 确保正确导入并注册 CanvasRenderer
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers'; // 确保导入 CanvasRenderer
import { TreeChart } from 'echarts/charts';
import {
  TooltipComponent,
  LegendComponent
} from 'echarts/components';

import type { Individual } from '@/store/individual';
import type { KnowledgeNode } from '@/store/knowledgeGraph';

import Markdown from '@/components/Markdown.vue';

// 确保正确注册所有组件
use([
  CanvasRenderer, // 必须注册 CanvasRenderer
  TreeChart,
  TooltipComponent,
  LegendComponent
]);

interface LearningNode {
  id: string;
  name: string;
  depth: number;
  status: 'completed' | 'in-progress' | 'not-started';
  progress: number;
  timeCost: number;
  children?: LearningNode[];
}

// 从 store 获取数据
const individualStore = useIndividualStore();
const knowledgeStore = useKnowledgeGraphStore();

// 学生数据
const students = ref<Individual[]>([]);
const currentStudent = ref<Individual | null>(null);
const searchQuery = ref('');

// 知识点数据
const knowledgeNodes = ref<{[key: string]: KnowledgeNode}>({});

// 学习路径数据
const pathData = ref<string[]>([]);

// 节点状态数据
const nodeData = ref<{[key: string]: any}>({});

// 状态标签
const statusLabels : {[key: string]: string} = {
  'completed': '已完成',
  'in-progress': '进行中',
  'not-started': '未开始'
};

// 选择的节点
const selectedNode = ref<LearningNode | null>(null);

// 过滤后的学生列表
const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value;
  
  return students.value.filter(student => 
    student.sid.includes(searchQuery.value) || 
    (knowledgeNodes.value[student.sid]?.name || '').includes(searchQuery.value)
  );
});

// 获取节点名称
const getNodeName = (id: string) => {
  return knowledgeNodes.value[id]?.name;
};

// 获取节点定义
const getNodeDefinition = (id: string) => {
  return knowledgeNodes.value[id]?.definition;
};

// 获取节点类型
const getNodeType = (id: string) => {
  return knowledgeNodes.value[id]?.type;
};

// 选择学生
const selectStudent = (student: Individual) => {
  currentStudent.value = student;
  pathData.value = student.route;
  
  // 更新节点状态数据（这里简化处理，实际应根据学生进度数据）
  nodeData.value = {};
  student.route.forEach((id, index) => {
    const progress = Math.min(1, Math.max(0, student.degree - index * 0.2));
    const status = progress === 1 ? 'completed' : 
                  progress > 0 ? 'in-progress' : 'not-started';
    
    nodeData.value[id] = {
      status,
      progress,
      timeCost: 30 + index * 5
    };
  });
  
  // 重置选中的节点
  if (student.route.length > 0) {
    const firstId = student.route[0];
    selectedNode.value = {
      id: firstId,
      name: getNodeName(firstId) || `节点 ${firstId}`,
      depth: firstId.split('-').length,
      ...nodeData.value[firstId]
    } as LearningNode;
  }
};

// 构建线性树结构
const learningTree = computed<LearningNode[]>(() => {
  if (!pathData.value || pathData.value.length === 0) return [];
  
  let prevNode: LearningNode | null = null;
  const rootNodes: LearningNode[] = [];
  
  for (const id of pathData.value) {
    const data = nodeData.value[id] || {
      status: 'not-started',
      progress: 0,
      timeCost: 30
    };
    
    const node: LearningNode = {
      id,
      name: getNodeName(id) || `节点 ${id}`,
      depth: id.split('-').length,
      status: data.status,
      progress: data.progress,
      timeCost: data.timeCost
    };
    
    if (!prevNode) {
      rootNodes.push(node);
    } else {
      if (!prevNode.children) prevNode.children = [];
      prevNode.children.push(node);
    }
    
    prevNode = node;
  }
  
  return rootNodes;
});

// 树图配置
const treeOption = computed(() => ({
  backgroundColor: '#f8fbff',
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#e4e7ed',
    borderWidth: 1,
    textStyle: {
      color: '#333'
    },
    formatter: (params: any) => {
      const data = params.data as LearningNode;
      return `<div style="margin: 5px 0; font-weight: bold">${data.name}</div>
              <div style="display:flex; margin-top: 5px">
                <div style="background: ${getStatusColor(data.status)}; 
                      width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; margin-right: 5px">
                </div>
                <span>${statusLabels[data.status]}</span>
              </div>
              <div>完成度: <b>${data.progress}%</b></div>`;
    }
  },
  series: [
    {
      type: 'tree',
      data: learningTree.value,
      layout: 'orthogonal',
      orient: 'TB',
      symbol: 'circle',
      symbolSize: 28,
      label: {
        position: 'right',
        verticalAlign: 'middle',
        align: 'left',
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        padding: [0, 0, 0, 10],
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 3,
        formatter: (params: any) => {
          const data = params.data as LearningNode;
          return data.name;
        }
      },
      lineStyle: {
        color: '#409EFF',
        width: 10,
        curveness: 0.1
      },
      encode: {
          name: 'name',
          value: 'id',
          tooltip: ['name', 'status', 'progress']
      },
      itemStyle: {
        color: (params: any) => {
          const data = params.data as LearningNode;
          return getStatusColor(data.status);
        },
        borderWidth: 0,
        shadowBlur: 8,
        shadowColor: 'rgba(0, 0, 0, 0.2)'
      },
      emphasis: {
        itemStyle: {
          borderWidth: 3,
          borderColor: '#303133'
        },
        label: {
          show: true,
          fontWeight: 'bold',
          fontSize: 14
        }
      },
      expandAndCollapse: false,
      animationDuration: 500,
      roam: true,
      initialTreeDepth: 7
    }
  ]
}));

// 获取节点状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return '#67C23A';
    case 'in-progress': return '#E6A23C';
    case 'not-started': return '#909399';
    default: return '#409EFF';
  }
};

// 图表点击事件处理
const onChartClick = (params: any) => {
  if (params.data) {
    const node = params.data as LearningNode;
    // 更新选中的节点
    selectedNode.value = {
      ...node,
      name: getNodeName(node.id) || `节点 ${node.id}`,
      timeCost: node.timeCost || 30
    };
  }
};

// 组件挂载时加载数据
onMounted(async () => {
  // 从 store 加载学生数据
  students.value = individualStore.individual;
  
  // 从 store 加载知识点数据并转换为映射
  const nodes = knowledgeStore.getKnowledgeGraph();
  const nodeMap: {[key: string]: KnowledgeNode} = {};
  nodes.forEach(node => {
    nodeMap[node.id] = node;
  });
  knowledgeNodes.value = nodeMap;
  
  // 默认选择第一个学生
  if (students.value.length > 0) {
    selectStudent(students.value[0]);
  }
});
</script>

<style scoped>
.learning-path-container {
  display: flex;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f0ff 100%);
  border-radius: 10px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.student-directory {
  width: 320px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  overflow: hidden;
}

.student-directory h2 {
  color: #1890ff;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 22px;
  text-align: center;
}

.search-box {
  position: relative;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 10px 15px 10px 35px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #bfbfbf;
}

.student-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
}

.student-item {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 12px;
  background: #f9fbfe;
  border: 1px solid #e8f4ff;
  cursor: pointer;
  transition: all 0.3s;
}

.student-item:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.student-item.active {
  background: #e6f7ff;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.student-id {
  font-weight: bold;
  font-size: 16px;
  color: #1890ff;
  margin-bottom: 8px;
}

.student-degree {
  font-size: 14px;
  color: #595959;
  margin-bottom: 10px;
}

.degree-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  margin-top: 5px;
  overflow: hidden;
}

.degree-progress {
  height: 100%;
  background: linear-gradient(90deg, #36cfc9, #1890ff);
  border-radius: 3px;
}

.student-path {
  font-size: 13px;
}

.path-label {
  color: #8c8c8c;
  margin-right: 5px;
}

.path-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}

.path-tag {
  background: #e6f7ff;
  color: #1890ff;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  color: #1890ff;
  margin: 0;
  font-size: 28px;
}

.current-student-info {
  display: flex;
  gap: 20px;
  font-size: 16px;
  color: #595959;
}

.current-student-info span {
  background: #e6f7ff;
  padding: 5px 15px;
  border-radius: 20px;
}

.chart-container {
  width: 100%;
  height: 600px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  overflow: hidden;
}

.chart {
  width: 100%;
  height: 100%;
}

.node-details {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.status-tag {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
}

.status-tag.completed {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.status-tag.in-progress {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.status-tag.not-started {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e9e9eb;
}

.node-details h3 {
  font-size: 22px;
  color: #303133;
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.progress-section {
  margin-bottom: 25px;
}

.progress-bar {
  height: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-value {
  height: 100%;
  background: linear-gradient(90deg, #3a8ffe, #41d6ff);
  border-radius: 8px;
  transition: width 0.5s ease;
}

.description {
  font-size: 16px;
  line-height: 1.7;
  color: #606266;
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f9fbfe;
  border-left: 4px solid #409eff;
  border-radius: 0 4px 4px 0;
}

.node-meta {
  display: flex;
  gap: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 15px;
  color: #606266;
  background: #f9f9f9;
  padding: 8px 15px;
  border-radius: 4px;
}

.meta-item i {
  font-size: 18px;
  margin-right: 8px;
  color: #409eff;
}
</style>