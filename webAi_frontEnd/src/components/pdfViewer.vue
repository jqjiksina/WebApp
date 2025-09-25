<template>
  <div class="pdf-viewer">
    <div class="pdf-header">
      <span>{{ activePdfTitle }}</span>
      <button @click="toggleFullscreen" class="fullscreen-btn">
        {{ isFullscreen ? '退出全屏' : '全屏' }}
      </button>
    </div>
    
    <iframe 
      ref="pdfFrame"
      :src="pdfUrl" 
      class="pdf-iframe"
      :class="{ 'fullscreen': isFullscreen }"
      frameborder="0"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, watch } from 'vue'

const props = defineProps<{
  pdfUrl: string
}>()

const pdfFrame = ref<HTMLIFrameElement | null>(null)
const isFullscreen = ref(false)
const activePdfTitle = ref('')

// 从URL中提取文件名作为标题
watch(() => props.pdfUrl, (url) => {
  if (url) {
    const pathParts = url.split('/')
    const fileName = pathParts[pathParts.length - 1]
    activePdfTitle.value = decodeURIComponent(fileName.replace('.pdf', ''))
  }
})

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    const elem = pdfFrame.value
    if (elem?.requestFullscreen) {
      elem.requestFullscreen()
    }
  } else {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }
}

// 监听全屏变化
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
})
</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-header {
  padding: 10px 15px;
  background: #2c5282;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fullscreen-btn {
  background: #4a76a8;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
}

.pdf-iframe {
  flex: 1;
  width: 100%;
  border: none;
  min-height: 500px;
}

/* 全屏模式 */
.pdf-iframe.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
}
</style>