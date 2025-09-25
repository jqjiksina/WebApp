<template>
    <p>上传课程pdf或者学生信息json</p>
    <div>
      <button 
        class="upload-button"
        :disabled="isUploading"
        @click="triggerFileInput"
      >
        {{ isUploading ? '上传中...' : '上传文件' }}
      </button>
      <input 
        type="file" 
        ref="fileInput"
        hidden
        accept=".pdf, .json, application/pdf, application/json"
        @change="handleFileUpload"
      />
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue'
  
  const fileInput = ref<HTMLInputElement | null>(null)
  const isUploading = ref(false)
  
  // 后端API端点（根据需要修改）
  const UPLOAD_URL = 'https://your-api.com/upload'
  
  // 触发文件选择
  const triggerFileInput = () => {
    fileInput.value?.click()
  }
  
  // 处理文件上传
  const handleFileUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return
  
    const file = input.files[0]
    isUploading.value = true
  
    try {
      const formData = new FormData()
      formData.append('file', file)
  
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData
      })
  
      if (!response.ok) {
        throw new Error(`上传失败: ${response.statusText}`)
      }
  
      console.log('上传成功', await response.json())
    } catch (error) {
      console.error('上传出错:', error)
      alert('上传失败，请重试')
    } finally {
      isUploading.value = false
      // 重置输入以允许再次上传相同文件
      if (fileInput.value) fileInput.value.value = ''
    }
  }
  </script>
  
  <style scoped>
  .upload-button {
    padding: 8px 16px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }
  
  .upload-button:hover {
    background-color: #2980b9;
  }
  
  .upload-button:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
  </style>