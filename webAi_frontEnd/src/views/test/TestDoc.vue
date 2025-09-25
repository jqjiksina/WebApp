<template>
    <div class="document-uploader">
      <div class="upload-container">
        <input 
          type="file" 
          ref="fileInput"
          accept=".docx"
          @change="handleFileChange"
          class="file-input"
        >
        
        <div 
          class="drop-area"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          :class="{ 'active': isDragging }"
        >
          <i class="fas fa-cloud-upload-alt"></i>
          <p>拖放 Word 文档到此处</p>
          <p>或</p>
          <button @click="triggerFileInput" class="btn select-btn">
            选择文件
          </button>
        </div>
        
        <div v-if="selectedFile" class="file-info">
          <div class="file-details">
            <i class="fas fa-file-word"></i>
            <div>
              <div class="file-name">{{ selectedFile.name }}</div>
              <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
            </div>
          </div>
          <button @click="parseDocument" class="btn parse-btn">
            <i class="fas fa-cogs"></i> 解析文档
          </button>
        </div>
        
        <div v-if="parsedText" class="preview-section">
          <h3>解析预览</h3>
          <div class="preview-content">
            <p>{{ parsedTextPreview }}</p>
          </div>
          <button 
            @click="uploadText" 
            class="btn upload-btn"
            :disabled="isUploading"
          >
            <i class="fas fa-cloud-upload-alt"></i> 
            {{ isUploading ? '上传中...' : '上传解析结果' }}
          </button>
        </div>
        
        <div v-if="statusMessage" class="status-message" :class="statusClass">
          <i :class="statusIcon"></i> {{ statusMessage }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import * as mammoth from 'mammoth';
  import axios from 'axios';
  
  // 状态管理
  const isDragging = ref(false);
  const selectedFile = ref<File | null>(null);
  const parsedText = ref('');
  const isUploading = ref(false);
  const statusMessage = ref('');
  const statusType = ref<'success' | 'error' | 'loading'>('success');
  const fileInput = ref<HTMLInputElement | null>(null);
  
  // 计算属性
  const parsedTextPreview = computed(() => {
    return parsedText.value.length > 200 
      ? parsedText.value.substring(0, 200) + '...' 
      : parsedText.value;
  });
  
  const statusClass = computed(() => {
    return `status-${statusType.value}`;
  });
  
  const statusIcon = computed(() => {
    return {
      'success': 'fas fa-check-circle',
      'error': 'fas fa-exclamation-circle',
      'loading': 'fas fa-spinner fa-spin'
    }[statusType.value];
  });
  
  // 方法
  const triggerFileInput = () => {
    if (fileInput.value) {
      fileInput.value.click();
    }
  };
  
  const handleDrop = (e: DragEvent) => {
    isDragging.value = false;
    if (e.dataTransfer?.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      handleFile(input.files[0]);
    }
  };
  
  const handleFile = (file: File) => {
    // 验证文件类型和大小
    if (!file.name.endsWith('.docx')) {
      setStatus('error', '请上传 .docx 格式的 Word 文档');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error', '文件大小超过限制 (最大10MB)');
      return;
    }
    
    selectedFile.value = file;
    parsedText.value = '';
    setStatus('success', '文件已选择，请点击"解析文档"');
  };
  
  const parseDocument = async () => {
    if (!selectedFile.value) return;
    
    try {
      setStatus('loading', '正在解析文档...');
      
      // 读取文件为ArrayBuffer
      const arrayBuffer = await readFileAsArrayBuffer(selectedFile.value);
      
      // 使用Mammoth解析文档
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      parsedText.value = result.value;
      setStatus('success', '文档解析成功！');
    } catch (error) {
      console.error('解析失败:', error);
      setStatus('error', '文档解析失败: ' + (error as Error).message);
    }
  };
  
  const uploadText = async () => {
    if (!selectedFile.value || !parsedText.value) return;
    
    try {
      isUploading.value = true;
      setStatus('loading', '正在上传文本内容...');
      
      // 实际API调用 - 替换为您的后端URL
      await axios.post('/api/upload', {
        filename: selectedFile.value.name,
        content: parsedText.value
      });
      
      setStatus('success', '文本内容上传成功！');
    } catch (error) {
      console.error('上传失败:', error);
      setStatus('error', '上传失败: ' + (error as Error).message);
    } finally {
      isUploading.value = false;
    }
  };
  
  // 辅助函数
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const setStatus = (type: 'success' | 'error' | 'loading', message: string) => {
    statusType.value = type;
    statusMessage.value = message;
  };
  </script>
  
  <style scoped>
  .document-uploader {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .upload-container {
    background: #fff;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  }
  
  .file-input {
    display: none;
  }
  
  .drop-area {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 30px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 20px;
  }
  
  .drop-area.active {
    border-color: #42b983;
    background-color: rgba(66, 185, 131, 0.05);
  }
  
  .drop-area i {
    font-size: 3rem;
    color: #6c757d;
    margin-bottom: 15px;
  }
  
  .drop-area p {
    margin: 5px 0;
    color: #555;
  }
  
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  
  .select-btn {
    background: #4a6491;
    color: white;
    margin-top: 15px;
  }
  
  .select-btn:hover {
    background: #3a5278;
  }
  
  .file-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .file-details {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .file-details i {
    font-size: 2rem;
    color: #4a6491;
  }
  
  .file-name {
    font-weight: 600;
  }
  
  .file-size {
    color: #6c757d;
    font-size: 0.9rem;
  }
  
  .parse-btn {
    background: #42b983;
    color: white;
  }
  
  .parse-btn:hover {
    background: #359c6f;
  }
  
  .preview-section {
    margin-top: 20px;
  }
  
  .preview-section h3 {
    margin-bottom: 10px;
    color: #2c3e50;
  }
  
  .preview-content {
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 15px;
    max-height: 150px;
    overflow-y: auto;
    background: #f8f9fa;
    margin-bottom: 15px;
    line-height: 1.6;
  }
  
  .upload-btn {
    background: #4a6491;
    color: white;
    width: 100%;
    justify-content: center;
  }
  
  .upload-btn:hover:not(:disabled) {
    background: #3a5278;
  }
  
  .upload-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
  
  .status-message {
    padding: 12px;
    border-radius: 8px;
    margin-top: 20px;
    text-align: center;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  
  .status-success {
    background: rgba(66, 185, 131, 0.15);
    color: #359c6f;
  }
  
  .status-error {
    background: rgba(220, 53, 69, 0.15);
    color: #dc3545;
  }
  
  .status-loading {
    background: rgba(13, 110, 253, 0.15);
    color: #0d6efd;
  }
  </style>