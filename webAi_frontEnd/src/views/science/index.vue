<template>
    <div class="container">
      <h1>电磁场课程科研文献库</h1>
      
      <!-- 导航切换 -->
      <div class="mode-toggle">
        <button 
          :class="{ active: viewMode === 'chapters' }" 
          @click="viewMode = 'chapters'"
        >
          按章节查看
        </button>
        <button 
          :class="{ active: viewMode === 'topics' }" 
          @click="viewMode = 'topics'"
        >
          按知识点查看
        </button>
      </div>
      
      <!-- 章节视图 -->
      <div v-if="viewMode === 'chapters'" class="chapters-view">
        <div v-for="chapter in chapters" :key="chapter.id" class="chapter-card">
          <h2>{{ chapter.title }}</h2>
          <div v-for="paper in chapter.papers" :key="paper.id" class="paper-card">
            <div class="paper-header" @click="togglePaper(paper.id)">
              <span class="paper-title">{{ paper.title }}</span>
              <span class="expand-icon">{{ expandedPaper === paper.id ? '−' : '+' }}</span>
            </div>
            <div v-if="expandedPaper === paper.id" class="paper-details">
              <p class="paper-description">{{ paper.description || '暂无摘要' }}</p>
              <button class="view-pdf" @click="openPdf(paper.file)">
                <i class="pdf-icon"></i> 查看全文
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 知识点视图 -->
      <div v-if="viewMode === 'topics'" class="topics-view">
        <div class="topic-grid">
          <div v-for="topic in topics" :key="topic.id" class="topic-card">
            <h3>{{ topic.name }}</h3>
            <ul>
              <li v-for="paper in topic.papers" :key="paper.id">
                <span @click="openPdf(paper.file)">{{ paper.title }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- PDF查看器 -->
      <div v-if="activePdf" class="pdf-modal" @click.self="activePdf = ''">
        <div class="pdf-container-wrapper">
          <pdfViewer :pdf-url="getPdfUrl(activePdf)" />
          <button class="close-btn" @click="activePdf = ''">✕</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  // 导入PDF查看器组件
import pdfViewer from '@/components/pdfViewer.vue'

// 获取PDF的完整URL
const getPdfUrl = (fileName: string) => {
  // 根据你的文件存放路径调整
  return `/papers/${fileName}`
}
  
  // 定义类型
  interface Paper {
    id: string
    title: string
    file: string
    description?: string
  }
  
  interface Chapter {
    id: string
    title: string
    papers: Paper[]
  }
  
  interface Topic {
    id: string
    name: string
    papers: Paper[]
  }
  
  // 视图状态
  const viewMode = ref<'chapters' | 'topics'>('chapters')
  const expandedPaper = ref<string>('')
  const activePdf = ref<string>('')
  
  // 切换文献展开状态
  const togglePaper = (id: string) => {
    expandedPaper.value = expandedPaper.value === id ? '' : id
  }
  
  // 打开PDF文件
  const openPdf = (file: string) => {
    activePdf.value = file
  }
  
  // 章节数据
  const chapters = ref<Chapter[]>([
    {
      id: 'ch1',
      title: '第一章 研究现状与发展',
      papers: [
        {
          id: 'p1-1',
          title: '我国电磁场理论研究的现状及发展展望',
          file: '我国电磁场理论研究的现状及发展展望.pdf',
          description: '探讨国内电磁场理论研究现状与未来发展趋势'
        }
      ]
    },
    {
      id: 'ch2',
      title: '第二章 数学基础理论',
      papers: [
        {
          id: 'p2-1',
          title: '散度、旋度和梯度在共同模式上的统一定义及其在一般坐标系中的应用',
          file: '散度、旋度和梯度在共同模式上的统一定义及其在一般坐标系中的应用.pdf',
          description: '建立数学算子的统一框架并应用于不同坐标系'
        }
      ]
    },
    {
      id: 'ch3',
      title: '第三章 静电场理论',
      papers: [
        {
          id: 'p3-1',
          title: 'One Method to Derivate Coulomb’s Law between Two Charges',
          file: 'One Method to Derivate Coulomb’s Law between Two Charges.pdf'
        },
        {
          id: 'p3-2',
          title: '静电势：一些混合边界值问题的新方法',
          file: '静电势：一些混合边界值问题的新方法.pdf'
        }
      ]
    },
    // 其他章节数据（部分省略以保持代码简洁）
    {
      id: 'ch10',
      title: '第十章 波导特性研究',
      papers: [
        {
          id: 'p10-1',
          title: '具有模式滤波特性的TE₂₀模式90°波导扭曲的新概念',
          file: '具有模式滤波特性的TE₂₀模式90°波导扭曲的新概念.pdf',
          description: '提出新型波导结构实现模式滤波功能'
        }
      ]
    }
  ])
  
  // 知识点数据
  const topics = ref<Topic[]>([
    {
      id: 'topic1',
      name: '坡印亭矢量',
      papers: [
        {
          id: 't1-1',
          title: '从准静态庞印廷定理推导科尔特维格-亥姆霍兹电和磁致伸缩...',
          file: '从准静态庞印廷定理推导科尔特维格-亥姆霍兹电和磁致伸缩（包括电致伸缩和磁致伸缩）的科尔特维格-亥姆霍兹电密度和磁致伸缩.pdf'
        }
      ]
    },
    {
      id: 'topic2',
      name: '磁性材料特性',
      papers: [
        {
          id: 't2-1',
          title: '表征高频软铁氧体磁滞的新方法',
          file: '表征高频软铁氧体磁滞的新方法.pdf'
        }
      ]
    },
    {
      id: 'topic3',
      name: '波导传播特性',
      papers: [
        {
          id: 't3-1',
          title: '一种严格散射矩阵法分析光子晶体波导中电磁波传播',
          file: '一种严格散射矩阵法分析光子晶体波导中电磁波传播.pdf'
        },
        {
          id: 't3-2',
          title: '太赫兹波导及其激光谐振腔耦合损失的研究',
          file: '太赫兹波导及其激光谐振腔耦合损失的研究_廖铭恬.pdf'
        }
      ]
    },
    // 其他知识点数据
    {
      id: 'topic7',
      name: '传输线技术',
      papers: [
        {
          id: 't7-1',
          title: '全固态射频等离子体源中阻抗匹配技术的研究',
          file: "全固态射频等离子体源中阻抗匹配技术的研究.pdf"
        }
      ]
    }
  ])
  </script>
  
  <style scoped>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    color:#555;
  }
  
  .mode-toggle {
    display: flex;
    margin: 20px 0;
    gap: 10px;
  }
  
  .mode-toggle button {
    padding: 10px 20px;
    background-color: #f0f0f0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .mode-toggle button.active {
    background-color: #4a76a8;
    color: white;
  }
  
  .chapter-card, .topic-card {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  
  .paper-card {
    background-color: white;
    border-radius: 6px;
    margin: 10px 0;
    overflow: hidden;
  }
  
  .paper-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background-color: #e3f2fd;
    cursor: pointer;
  }
  
  .paper-title {
    font-weight: 500;
    flex: 1;
  }
  
  .expand-icon {
    font-weight: bold;
    font-size: 1.2rem;
  }
  
  .paper-details {
    padding: 15px;
    border-top: 1px solid #eee;
  }
  
  .paper-description {
    color: #555;
    margin-bottom: 15px;
  }
  
  .view-pdf {
    background-color: #4a76a8;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .pdf-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    background-color: white;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M19.56,11.36,13,3.06A2,2,0,0,0,11.49,2H4A2,2,0,0,0,2,4V20a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V12.93A2,2,0,0,0,19.56,11.36ZM18,20H6V4h5v6h7ZM8,12H6v5H8Zm6,5H12V15a1,1,0,0,1,1-1h1a2,2,0,0,1,0,4ZM18,12H16v5h1a1,1,0,0,0,0-2H18Zm-7-1V7.29L15.37,11Z'/%3E%3C/svg%3E");
  }
  
  .topic-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  
  .topic-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .topic-card h3 {
    margin-top: 0;
    color: #2c5282;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 10px;
  }
  
  .topic-card ul {
    padding-left: 20px;
  }
  
  .topic-card li {
    margin: 10px 0;
    cursor: pointer;
    color: #3182ce;
    text-decoration: underline;
  }
  
  .topic-card li:hover {
    color: #2c5282;
  }
  
  .pdf-modal {
  position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .pdf-container-wrapper {
  position: relative;
  width: 95%; /* 更大的宽度 */
  height: 95%; /* 更大的高度 */
  max-width: 1200px; /* 最大宽度限制 */
  background: #fff;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
  
  .pdf-container {
    position: relative;
    width: 80%;
    height: 90%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .pdf-container iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
  
  .close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.5);
    color: white;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
  }
  </style>