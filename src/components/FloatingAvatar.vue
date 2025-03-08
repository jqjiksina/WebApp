<template>
  <div
    ref="avatarElement"
    class="floating-avatar"
    :style="avatarStyle"
    @mousedown="startDrag"
    @mouseenter="showDialog = true"
    @mouseleave="showDialog = false"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <img alt="虚拟形象" @dragstart.prevent :src="avatarImage">

    <transition name="fade">
      <div
        v-show="showDialog"
        class="dialog"
        :style="dialogStyle"
      >
        <div class="dialog-content">
          {{ dialogContent }}
        </div>
        <div class="dialog-arrow"></div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type CSSProperties } from 'vue'

interface Position {
  x: number
  y: number
}

interface Props {
  avatarImage?: string
  size?: number
  hideThreshold?: number
  dialogContent?: string
  container: HTMLElement | null
}

const props = withDefaults(defineProps<Props>(), {
  avatarImage: '',
  size: 60,
  hideThreshold: 30,
  dialogContent: '你好，需要帮助吗？',
  container: null
})

// const container = ref<HTMLElement | null>(null)
const avatarElement = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const showDialog = ref(false)
const position = ref<Position>({ x: 100, y: 100 })
const dragStartOffset = ref<Position>({ x: 0, y: 0 })
const touchIdentifier = ref<number | null>(null)

// 组件样式计算
const avatarStyle = computed<CSSProperties>(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px)`,
  width: `${props.size}px`,
  height: `${props.size}px`,
  cursor: isDragging.value ? 'grabbing' : 'grab'
}))

// 对话框样式计算
const dialogStyle = computed<CSSProperties>(() => {
  if (!props.container) return {}
  const containerWidth = props.container.offsetWidth
  return {
    left: position.value.x > containerWidth / 2 ? 'auto' : '100%',
    right: position.value.x > containerWidth / 2 ? '100%' : 'auto'
  }
})

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  if (touchIdentifier.value !== null) return
  touchIdentifier.value = e.touches[0].identifier
  startDrag(e.touches[0])
}

const handleTouchMove = (e: TouchEvent) => {
  const touch = Array.from(e.touches).find(
    t => t.identifier === touchIdentifier.value
  )
  if (touch) onDrag(touch)
}

const handleTouchEnd = () => {
  touchIdentifier.value = null
  stopDrag()
}

// 开始拖动
const startDrag = (e: MouseEvent | Touch) => {
  isDragging.value = true
  dragStartOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  window.addEventListener('mousemove', onMouseDrag)
  window.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: Touch) => {
  if (!isDragging.value) return;
  updatePosition(e.clientX, e.clientY)
}
// 鼠标拖动处理
const onMouseDrag = (e: MouseEvent) => {
  if (!isDragging.value) return
  updatePosition(e.clientX, e.clientY)
}

// 通用位置更新
const updatePosition = (clientX: number, clientY: number) => {
  if (!props.container || !avatarElement.value) return

  const containerRect = props.container.getBoundingClientRect()
  const avatarRect = avatarElement.value.getBoundingClientRect()

  const newX = clientX - dragStartOffset.value.x
  const newY = clientY - dragStartOffset.value.y

  position.value = {
    x: Math.max(0, Math.min(
      newX,
      containerRect.width - avatarRect.width
    )),
    y: Math.max(0, Math.min(
      newY,
      containerRect.height - avatarRect.height
    ))
  }
}

// 停止拖动
const stopDrag = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', onMouseDrag)
  window.removeEventListener('mouseup', stopDrag)
  checkEdgeHide()
}

// 边缘隐藏检测
const checkEdgeHide = () => {
  if (!props.container || !avatarElement.value) return

  const containerRect = props.container.getBoundingClientRect()
  const avatarRect = avatarElement.value.getBoundingClientRect()
  const threshold = props.hideThreshold

  // 左右边缘检测
  if (position.value.x < threshold) {
    position.value.x = -avatarRect.width + threshold
  } else if (position.value.x > containerRect.width - avatarRect.width - threshold) {
    position.value.x = containerRect.width - threshold
  }

  // 上下边缘检测
  if (position.value.y < threshold) {
    position.value.y = -avatarRect.height + threshold
  } else if (position.value.y > containerRect.height - avatarRect.height - threshold) {
    position.value.y = containerRect.height - threshold
  }
}

// 响应式布局处理s
const resizeObserver = new ResizeObserver(() => { //observe的DOM元素变更时触发该lambda函数
  if (!props.container || !avatarElement.value) return;

  const containerRect = props.container.getBoundingClientRect();
  const avatarRect = avatarElement.value.getBoundingClientRect();
  //console.log("contantRect: " + containerRect.width + " avatarRect: " + avatarRect.width)

  position.value.x = Math.min(  //父容器右边框触碰到avatar右边框时，保持右边框重合
    position.value.x,
    containerRect.width - avatarRect.width
  );
  position.value.y = Math.min(  //父容器下边框触碰到avatar下边框时，保持下边框重合
    position.value.y,
    containerRect.height - avatarRect.height
  );
})

onMounted(() => {
  if (props.container) {
    resizeObserver.observe(props.container)
  }
})

onUnmounted(() => {
  resizeObserver.disconnect()
})
</script>

<style scoped>
.floating-avatar {
  position: absolute;
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  touch-action: none;
  user-select: none;
  z-index: 1000;      /*保持顶部悬浮*/

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s;
  }

  &:hover img {
    transform: scale(1.1);
  }
}

.dialog {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  min-width: 200px;
  background: #1b1919;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  pointer-events: none;

  &-content {
    position: relative;
    z-index: 2;
  }

  &-arrow {
    position: absolute;
    width: 12px;
    height: 12px;
    background: white;
    transform: rotate(45deg);
    z-index: 1;

    [style*="left: 100%"] & {
      left: -6px;
    }
    [style*="right: 100%"] & {
      right: -6px;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
