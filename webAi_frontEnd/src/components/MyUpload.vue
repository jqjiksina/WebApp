<template>
    <el-upload
    class="upload-demo"
    :http-request="handleUpload"
    :on-success="handleUploadSuccess"
    :on-error="handleUploadError"
    :before-upload="beforeUpload"
    accept=".doc,.docx,.md,.pdf"
    >
    <el-button type="primary">上传简历</el-button>
    </el-upload>
  </template>
  
<script setup lang="ts">
import { resumeApi } from '@/api/resumeApi';
import { ElMessage } from 'element-plus';
import mammoth from 'mammoth';
  
const handleUpload = async (params: { file: File }) => {
    const file = params.file

    const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    // use mammoth 
    const arrayBuffer = await readFileAsArrayBuffer(file)
    const result = await mammoth.extractRawText({ arrayBuffer });
    console.log("parsed document:",result.value)
    resumeApi.upload(result.value)
}
  
// 处理文件上传
const handleUploadSuccess = async (_response: any) =>{
  
}

const handleUploadError = () => {
  ElMessage.error('简历上传失败，请重试')
}

const beforeUpload = (_file: File) => {
  const isWord = true
  if (!isWord) {
    ElMessage.error('只能上传 Word、Markdown 文档！')
    return false
  }
  return true
}
</script>