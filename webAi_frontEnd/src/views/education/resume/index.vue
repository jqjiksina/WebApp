<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="resume-container">
    <el-card class="resume-card">
      <template #header>
        <div class="card-header">
          <span>简历修改助手</span>
          <el-upload
            class="upload-demo"
            :http-request="resumeApi.upload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            accept=".doc,.docx,.md,.pdf"
          >
            <el-button type="primary">上传简历</el-button>
          </el-upload>
        </div>
      </template>

      <div class="chat-container">
        <div class="chat-messages" ref="messagesContainer">
          <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
            <div class="message-content">
              <div class="message-header">
                <el-avatar :size="32" :src="message.role === 'user' ? userAvatar : aiAvatar" />
                <span class="message-role">{{ message.role === 'user' ? '我' : '简历助手' }}</span>
              </div>
              <div class="message-text" v-html="formatMessage(message.content)"></div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题..."
            @keyup.enter.ctrl="sendMessage"
          />
          <el-button type="primary" @click="sendMessage" :loading="loading">发送</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="ResumeChat">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { resumeApi } from '@/api/resume/resumeApi'

const messages = ref<Array<{ role: 'user' | 'assistant', content: string }>>([])
const inputMessage = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const userAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const aiAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

const resume_session_id = ref("")

// 格式化消息内容，支持换行和链接
const formatMessage = (content: string) => {
  return content.replace(/\n/g, '<br>')
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  const userMessage = inputMessage.value
  messages.value.push({ role: 'user', content: userMessage })
  inputMessage.value = ''
  loading.value = true

  try {
    const response = await resumeApi.chat(resume_session_id.value,userMessage)
    console.log("[Debug] sendMessage success!")
    resume_session_id.value = response.data.session_id
    messages.value.push({ role: 'assistant', content: response.data.content })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    ElMessage.error('发送消息失败，请重试')
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

// 处理文件上传
const handleUploadSuccess = (response: any) => {
  ElMessage.success('简历上传成功')
  messages.value.push({
    role: 'assistant',
    content: '我已经收到您的简历，我可以帮您：\n1. 分析简历内容\n2. 提供修改建议\n3. 优化表达方式\n4. 调整格式结构\n\n请告诉我您想先从哪个方面开始？'
  })
  scrollToBottom()
}

const handleUploadError = () => {
  ElMessage.error('简历上传失败，请重试')
}

const beforeUpload = (file: File) => {
  // const isWord = file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const isWord = true
  if (!isWord) {
    ElMessage.error('只能上传 Word 文档！')
    return false
  }
  return true
}

// 初始化对话
onMounted(() => {
  messages.value.push({
    role: 'assistant',
    content: '您好！我是您的简历修改助手。\n\n您可以：\n1. 直接上传 Word 格式的简历\n2. 告诉我您想修改的内容\n3. 询问简历相关的任何问题\n\n我会为您提供专业的建议和指导。'
  })
})
</script>

<style scoped>
.resume-container {
  padding: 20px;
  height: 100%;
}

.resume-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.message.user .message-content {
  background-color: #ecf5ff;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.message-role {
  font-weight: bold;
}

.message-text {
  line-height: 1.6;
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 10px;
}

.chat-input .el-input {
  flex: 1;
}

:deep(.el-upload) {
  display: inline-block;
}
</style>
