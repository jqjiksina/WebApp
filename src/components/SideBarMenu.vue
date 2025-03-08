
<template>
  <div class="menu-container">
    <!-- 触发按钮 -->
    <button
      ref="triggerButton"
      @click="toggleMenu"
    >
      显示菜单
    </button>

    <!-- 悬浮菜单 -->
    <transition name="fade">
      <div
        v-show="isMenuVisible"
        ref="menu"
        class="dropdown-menu"
      >
        <div class="menu-item">选项一</div>
        <div class="menu-item">选项二</div>
        <div class="menu-item">选项三</div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 菜单显示状态
const isMenuVisible = ref(false)

// DOM 元素引用
const triggerButton = ref(null)
const menu = ref(null)

// 切换菜单显示
const toggleMenu = () => {
  if (isMenuVisible.value) {
    closeMenu()
  } else {
    isMenuVisible.value = true
  }
}

// 关闭菜单
const closeMenu = () => {
  isMenuVisible.value = false
}

// 处理外部点击
const handleClickOutside = (event) => {
  if(!menu.value || !triggerButton.value) return;
  const triggerValue = triggerButton.value as HTMLElement;
  const menuValue = menu.value as HTMLDivElement;
  if (
    isMenuVisible.value &&
    !triggerValue.contains(event.target) &&
    !menuValue.contains(event.target)
  ) {
    closeMenu()
  }
}

// 事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.menu-container {
  position: relative;
  display: inline-block;
  display: flex;
  flex-direction: column;
}

button {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex-grow: 1;
}

.dropdown-menu {
  position: absolute;
  top:-200px;
  height: 200px;
  min-width: 120px;
  background: rgb(59, 59, 59);
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  z-index: 100;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 1rem;
  color: rgb(182, 182, 182);
}

.menu-item:hover {
  background: #f5f7fa;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
  transform-origin: top center;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scaleY(0.8);
}
</style>
