<!-- BaseDialog.vue -->
<!-- <template>
  <Teleport to="body">
    <dialog
      ref="dialogRef"
      class="dialog"
      :class="contentClass"
      @close="handleClose"
      @cancel="handleCancel"
    >
      <div class="dialog-content" @click.stop>
        <slot></slot>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  contentClass: String,
  persistent: Boolean, // 是否禁用点击外部关闭
  escapeClose: { // 是否允许 ESC 关闭
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const dialogRef = ref(null)

// 同步外部状态变化
watch(() => props.modelValue, (val) => {
  if (val) {
    console.log("dialog open!")
    dialogRef.value?.showModal()
    document.documentElement.style.overflow = 'hidden'
  } else {
    console.log("dialog close!")
    dialogRef.value?.close()
    document.documentElement.style.removeProperty('overflow')
  }
})

// 处理原生关闭事件
const handleClose = () => {
  console.log("dialog handleClose")
  emit('update:modelValue', false)
  emit('close')
}

// 处理 ESC 关闭
const handleCancel = (e) => {
  console.log("dialog handle cancel")
  if (!props.escapeClose) {
    e.preventDefault()
  }
}

// 点击外部处理
onMounted(() => {
  dialogRef.value?.addEventListener('click', (e) => {
    console.log("click outside")
    if (!props.persistent && e.target === dialogRef.value) {
      dialogRef.value.close()
    }
  })
})
</script>

<style scoped>
.dialog {
  border: none;
  padding: 0;
  background: transparent;
  max-width: 90vw;
}

.dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  transition: opacity 1s;
}

.dialog-content {
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* dialog {
  transition: opacity 1s ease;
  opacity: 1;
} */

/* dialog:not([open]){
  opacity: 0;
  display: none;
} */

</style> -->

<template>
  <Teleport to="body">
    <Transition name="fade" @after-leave="handleTransitionEnd">
      <dialog
        v-if="modelValue"
        ref="dialogRef"
        class="dialog"
        :class="contentClass"
        @close="handleClose"
        @cancel="handleCancel"
      >
        <div class="dialog-content" @click.stop>
          <slot></slot>
        </div>
      </dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  contentClass: String,
  persistent: Boolean, // 是否禁用点击外部关闭
  escapeClose: { // 是否允许 ESC 关闭
    type: Boolean,
    default: true
  }
})

// ...其他代码保持相同
const emit = defineEmits(['update:modelValue', 'close'])

const dialogRef = ref()

// 处理原生关闭事件
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

// 处理 ESC 关闭
const handleCancel = (e : KeyboardEvent) => {
  if (!props.escapeClose) {
    e.preventDefault()
  }
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick() // 等待 DOM 更新
    if (!dialogRef.value) return
    dialogRef.value.showModal()
    dialogRef.value.addEventListener('click', (e : MouseEvent) => {
      console.log("click outside")
      if (!props.persistent && e.target === dialogRef.value) {
        dialogRef.value.close()
      }
    })
    document.documentElement.style.overflow = 'hidden'
  } else {
    // 关闭操作交给 transition 处理
    if (!dialogRef.value) return
    console.log("dialog close!")
    dialogRef.value.close()
  }
})

// 新增过渡结束处理
const handleTransitionEnd = () => {
  document.documentElement.style.removeProperty('overflow')
}
</script>

<style scoped>
/* 调整动画样式 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0s, transform 0s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 处理 backdrop 动画 */
dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 0s;
}

dialog[open]::backdrop {
  opacity: 1;
}
</style>
