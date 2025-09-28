<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang='ts'>
import { IconCommunity, FloatingAvatar } from '@/components';
import { onMounted, ref } from 'vue';

const floating_container = ref<HTMLElement|null>(null);

// 系统导航配置 - 外部系统链接
const systemModules = [
  {
    id: 'knowledge',
    name: '知识图谱系统',
    description: '知识管理、智能问答、学习路径',
    icon: '🧠',
    url: "http://" + import.meta.env.VITE_BACK_END_HOST + ":" + import.meta.env.VITE_KNOWLEDGE_PORT,
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  {
    id: 'academic',
    name: '学业分析系统',
    description: '学习分析、成绩预测、学习建议',
    icon: '📊',
    url: "http://" + import.meta.env.VITE_BACK_END_HOST + ":" + import.meta.env.VITE_TERMSYSTEM_PORT,
    color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    id : "docSite",
    name: "文档汇总",
    description: "开发文档、用户文档、测试文档",
    icon: '📚',
    url: "http://" + import.meta.env.VITE_BACK_END_URL + "/docSite",
    color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  }
];

const navigateToSystem = (url: string) => {
  // 在新标签页中打开外部系统
  window.open(url, '_blank');
};

onMounted(() => {
  console.log("Home View Mounted!")
});
</script>

<template>
  <div class='Home floating-container' ref='floating_container'>
    <!-- 页面标题 -->
    <div class='welcome-container'>
      <div class='welcome-head'>
        <i><IconCommunity/></i>
        <h1>智能教育系统导航</h1>
        <p class="subtitle">选择您要访问的模块</p>
      </div>
    </div>

    <!-- 系统模块网格 -->
    <div class="modules-grid">
      <div 
        v-for="module in systemModules" 
        :key="module.id"
        class="module-card"
        :style="{ '--card-color': module.color }"
        @click="navigateToSystem(module.url)"
        :title="`点击访问 ${module.name}`"
      >
        <div class="card-content">
          <div class="card-icon">{{ module.icon }}</div>
          <h3 class="card-title">{{ module.name }}</h3>
          <p class="card-description">{{ module.description }}</p>
          <div class="external-link-indicator">
            <span class="link-icon">🔗</span>
            <span class="link-text">外部系统</span>
          </div>
        </div>
        <div class="card-overlay"></div>
      </div>
    </div>

    <FloatingAvatar
      :size="60"
      :hide-threshold="40"
      :container="floating_container"
    >
      <template #avatarImage><img alt="虚拟形象" @dragstart.prevent src="@/assets/logo.svg"></template>
    </FloatingAvatar>
  </div>
</template>

<style scoped>
/* 主容器样式 */
.Home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
  box-sizing: border-box;
}

.floating-container {
  position: relative;
  overflow: hidden;
}

/* 欢迎区域样式 */
.welcome-container {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.welcome-head h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.subtitle {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin: 0;
  font-weight: 400;
}

.welcome-head i {
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

/* 模块网格布局 */
.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1rem;
}

/* 模块卡片样式 */
.module-card {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.module-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--card-color);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.module-card:hover::before {
  opacity: 0.1;
}

.module-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.module-card:active {
  transform: translateY(-4px) scale(1.01);
}

/* 卡片内容 */
.card-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #2c3e50;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.card-description {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

/* 外部链接指示器 */
.external-link-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  font-size: 0.8rem;
  color: #2c3e50;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.module-card:hover .external-link-indicator {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.link-icon {
  font-size: 0.9rem;
}

.link-text {
  font-weight: 500;
}

/* 卡片覆盖层 */
.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 3;
}

.module-card:hover .card-overlay {
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .Home {
    padding: 1rem;
  }
  
  .welcome-head h1 {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .modules-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .module-card {
    padding: 1.5rem;
    min-height: 160px;
  }
  
  .card-icon {
    font-size: 2.5rem;
  }
  
  .card-title {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .welcome-head h1 {
    font-size: 1.8rem;
  }
  
  .module-card {
    padding: 1rem;
    min-height: 140px;
  }
  
  .card-icon {
    font-size: 2rem;
  }
  
  .card-title {
    font-size: 1.2rem;
  }
  
  .card-description {
    font-size: 0.9rem;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.module-card {
  animation: fadeInUp 0.6s ease forwards;
}

.module-card:nth-child(1) { animation-delay: 0.1s; }
.module-card:nth-child(2) { animation-delay: 0.15s; }
.module-card:nth-child(3) { animation-delay: 0.2s; }
.module-card:nth-child(4) { animation-delay: 0.25s; }
.module-card:nth-child(5) { animation-delay: 0.3s; }
.module-card:nth-child(6) { animation-delay: 0.35s; }
.module-card:nth-child(7) { animation-delay: 0.4s; }
.module-card:nth-child(8) { animation-delay: 0.45s; }
</style>
