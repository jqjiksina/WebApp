<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="interview-container">
    <el-card class="interview-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>AI面试助手</span>
            <el-button type="primary" @click="showSessionList = !showSessionList">
              {{ showSessionList ? '隐藏会话列表' : '显示会话列表' }}
            </el-button>
          </div>
        </div>
      </template>

      <div class="chat-layout">
        <!-- 会话列表 -->
        <div v-if="showSessionList" class="session-list">
          <div class="session-list-header">
            <h3>历史面试</h3>
            <el-button type="text" @click="createNewSession">新建面试</el-button>
          </div>
          <el-scrollbar>
            <div class="session-items">
              <div
                v-for="session in sessions"
                :key="session.session_id"
                class="session-item"
                :class="{ active: session.session_id === activeSessionId }"
                @click="switchToSession(session.session_id)"
              >
                <div class="session-title">{{ session.title }}</div>
                <div class="session-time">{{ formatTime(session.updated_at) }}</div>
                <el-button
                  type="text"
                  class="delete-session"
                  @click.stop="deleteSession(session.session_id)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </el-scrollbar>
        </div>

        <!-- 聊天区域 -->
        <div class="chat-container">
          <!-- 数字人视频区域 -->
          <div class="avatar-container">
            <video
              ref="avatarVideo"
              autoplay
              playsinline
              :poster="avatarPoster"
              :class="{'speaking': isSpeaking}"
            ></video>
            <div class="avatar-status">
              <div v-if="connecting" class="connecting-status">
                <i class="el-icon-loading"></i> 正在连接数字人...
              </div>
              <div v-else-if="isSpeaking" class="speaking-status">
                <span class="status-dot"></span> 正在说话...
              </div>
              <div v-else class="idle-status">
                <span class="status-dot idle"></span> 已连接
              </div>
            </div>
          </div>

          <!-- 历史视频记录 -->
          <div v-if="activeSessionId" class="video-history">
            <div v-for="(video, index) in videoHistory" :key="index" class="video-item">
              <video
                :ref="'historyVideo' + index"
                :src="video.url"
                controls
                @play="handleVideoPlay(index)"
                @pause="handleVideoPause(index)"
              ></video>
              <div class="video-info">
                <span class="video-time">{{ formatTime(video.timestamp) }}</span>
                <span class="video-duration">{{ formatDuration(video.duration) }}</span>
              </div>
            </div>
          </div>

          <div class="chat-messages" ref="messagesContainer">
            <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
              <div class="message-content">
                <div class="message-header">
                  <el-avatar :size="32" :src="message.role === 'user' ? userAvatar : aiAvatar" />
                  <span class="message-role">{{ message.role === 'user' ? '我' : '面试官' }}</span>
                </div>
                <div class="message-text">{{ message.content }}</div>
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
              :disabled="isSpeaking"
            />
            <div class="button-container">
              <el-button 
                type="primary" 
                @click="sendMessage" 
                :loading="isSpeaking"
                :disabled="isSpeaking"
              >发送</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="Interview">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { ChatHistoryManager } from '@/utils/chatHistory'
import type { ChatMessage } from '@/types/resume'
import { createSession, closeSession } from '@/api/digital-person'
import type { Response_Offer } from './Type'

const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const activeSessionId = ref("")
const showSessionList = ref(false)
const chatHistory = new ChatHistoryManager("interview")
chatHistory.setChatContext(messages, messagesContainer, activeSessionId, inputMessage)

// 数字人相关状态
const avatarVideo = ref<HTMLVideoElement | null>(null)
const isSpeaking = ref(false)
const connecting = ref(false)
const peerConnection = ref<RTCPeerConnection | null>(null)
const avatarPoster = ref('/avatar-placeholder.png')
const digitalPersonAPI = 'digitalperson'
const sessionId = ref(0)
const digitalPersonSessionId = ref<string>('')

// 视频历史记录
const videoHistory = ref<Array<{
  url: string
  timestamp: number
  duration: number
}>>([])

// const isStreaming = computed(() => chatHistory.isSessionStreaming(activeSessionId.value).value)
const sessions = computed(() => chatHistory.getAllSessions().value)

const userAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const aiAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// 格式化视频时长
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 切换会话
const switchToSession = async (sessionId: string) => {
  chatHistory.switchToSession(sessionId)
  // 加载该会话的视频历史
  await loadVideoHistory(sessionId)
}

// 删除会话
const deleteSession = async (session_id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个面试记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    chatHistory.deleteSession(session_id)
    ElMessage.success('面试记录已删除')
  } catch {
    // 用户取消删除
  }
}

// 创建新会话
const createNewSession = () => {
  activeSessionId.value = ""
  messages.value = []
  videoHistory.value = []
  chatHistory.showWelcomeMessage('您好！我是您的AI面试官。\n\n在面试过程中，我会：\n1. 提出专业问题\n2. 评估您的回答\n3. 提供改进建议\n\n准备好了吗？让我们开始吧！')
  showSessionList.value = false
}

// 初始化数字人会话
const initDigitalPersonSession = async () => {
  try {
    const response = await createSession()
    digitalPersonSessionId.value = response.data.session_id
    console.log('Digital person session created:', digitalPersonSessionId.value)
  } catch (error) {
    console.error('Failed to create digital person session:', error)
  }
}

// 关闭数字人会话
const closeDigitalPersonSession = async () => {
  if (digitalPersonSessionId.value) {
    try {
      await closeSession(digitalPersonSessionId.value)
      console.log('Digital person session closed:', digitalPersonSessionId.value)
    } catch (error) {
      console.error('Failed to close digital person session:', error)
    }
  }
}


// 加载视频历史
const loadVideoHistory = async (sessionId: string) => {
  try {
    const response = await fetch(`${digitalPersonAPI}/get_session_videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionid: sessionId
      })
    })
    
    if (!response.ok) {
      throw new Error('加载视频历史失败')
    }
    
    const data = await response.json()
    videoHistory.value = data.videos || []
  } catch (error) {
    console.error('加载视频历史失败:', error)
  }
}

// 创建WebRTC连接
const createWebRTCConnection = async () => {
  try {
    connecting.value = true
    console.log('开始创建WebRTC连接...')
    
    peerConnection.value = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })
    
    peerConnection.value.onicecandidate = event => {
      if (event.candidate) {
        console.log('发现新的ICE候选:', event.candidate)
      }
    }
    
    peerConnection.value.ontrack = event => {
      if (avatarVideo.value && event.streams[0]) {
        console.log('收到远程视频流')
        avatarVideo.value.srcObject = event.streams[0]
        connecting.value = false
      }
    }
    
    const offer = await peerConnection.value.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true
    })
    
    await peerConnection.value.setLocalDescription(offer)

    const response = await fetch(`${digitalPersonAPI}/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sdp: peerConnection.value.localDescription?.sdp,
        type: 'offer'
      })
    })
    
    if (!response.ok) {
      throw new Error(`无法连接到数字人服务: ${response.statusText}`)
    }
    
    const answerData : Response_Offer = await response.json()
    console.log('收到WebRTC应答:', answerData)
    
    if (!answerData.sdp || !answerData.type || !answerData.sessionid) {
      throw new Error('WebRTC应答格式不正确，缺少必要参数') 
    }
    
    sessionId.value = answerData.sessionid
    
    const remoteDesc = new RTCSessionDescription({
      sdp: answerData.sdp,
      type: answerData.type as RTCSdpType
    })
    await peerConnection.value.setRemoteDescription(remoteDesc)
    
    console.log('WebRTC连接创建成功')
  } catch (error) {
    console.error('创建WebRTC连接失败:', error)
    connecting.value = false
    ElMessage.error('连接数字人失败，请稍后再试')
  }
}

// 开始录像,必须应该通过后端请求中介，进行多用户多会话管理！
const startRecording = async () => {
  try {
    const response = await fetch(`${digitalPersonAPI}/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionid: sessionId.value,
        type: 'start_record'
      })
    })
    
    if (!response.ok) {
      throw new Error('开始录像失败')
    }
    
    console.log('开始录像')
  } catch (error) {
    console.error('开始录像失败:', error)
  }
}

// 停止录像
const stopRecording = async () => {
  try {
    const response = await fetch(`${digitalPersonAPI}/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionid: sessionId.value,
        type: 'end_record'
      })
    })
    
    if (!response.ok) {
      throw new Error('停止录像失败')
    }
    
    console.log('停止录像')
    // 获取录像URL并添加到历史记录
    await addVideoToHistory()
  } catch (error) {
    console.error('停止录像失败:', error)
  }
}

// 添加视频到历史记录
const addVideoToHistory = async () => {
  try {
    const response = await fetch(`${digitalPersonAPI}/get_record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionid: sessionId.value
      })
    })
    
    if (!response.ok) {
      throw new Error('获取录像失败')
    }
    
    const data = await response.json()
    if (data.url) {
      videoHistory.value.push({
        url: data.url,
        timestamp: Date.now(),
        duration: data.duration || 0
      })
    }
  } catch (error) {
    console.error('添加视频到历史记录失败:', error)
  }
}

// 处理视频播放
const handleVideoPlay = (index: number) => {
  // 暂停其他视频
  videoHistory.value.forEach((_, i) => {
    if (i !== index) {
      const video = document.querySelector(`#historyVideo${i}`) as HTMLVideoElement
      if (video) {
        video.pause()
      }
    }
  })
}

// 处理视频暂停
const handleVideoPause = (_index: number) => {
  // 可以在这里添加暂停后的处理逻辑
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return
  
  const userMessage: ChatMessage = {
    role: 'user',
    content: inputMessage.value.trim(),
    timestamp: Date.now()
  }
  messages.value.push(userMessage)
  
  // 清空输入框
  inputMessage.value = ''
  
  // 开始录像
  await startRecording()
  
  try {
    // 发送消息到数字人
    const response = await fetch(`${digitalPersonAPI}/human`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionid: sessionId.value,
        type: 'chat',
        text: userMessage.content,
        interrupt: false
      })
    })
    
    if (!response.ok) {
      throw new Error('发送消息失败')
    }
    
    isSpeaking.value = true
    
    // 等待数字人回复完成
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 停止录像
    await stopRecording()
    
    isSpeaking.value = false
    
  } catch (error) {
    console.error('发送消息失败:', error)
    isSpeaking.value = false
    ElMessage.error('发送消息失败，请重试')
  }
}

// 组件挂载时创建WebRTC连接
onMounted(async () => {
  await initDigitalPersonSession()
  await createWebRTCConnection()
  chatHistory.loadSession()
  if (messages.value.length === 0) {
    chatHistory.showWelcomeMessage()
  }
})

// 组件卸载前清理资源
onBeforeUnmount(async () => {
  await closeDigitalPersonSession()
  if (peerConnection.value) {
    peerConnection.value.close()
    peerConnection.value = null
  }
})
</script>

<style scoped>
.interview-container {
  padding: 20px;
}

.interview-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-layout {
  display: flex;
  height: calc(100% - 60px);
  gap: 20px;
}

.session-list {
  width: 250px;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}

.session-list-header {
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-items {
  padding: 10px;
}

.session-item {
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  margin-bottom: 5px;
}

.session-item:hover {
  background-color: #f5f7fa;
}

.session-item.active {
  background-color: #ecf5ff;
}

.session-title {
  font-size: 14px;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-time {
  font-size: 12px;
  color: #909399;
}

.delete-session {
  position: absolute;
  right: 5px;
  top: 5px;
  opacity: 0;
}

.session-item:hover .delete-session {
  opacity: 1;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
}

.avatar-container {
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 20px;
}

.avatar-container video {
  width: 360px;
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.avatar-container video.speaking {
  box-shadow: 0 0 15px 5px rgba(64, 158, 255, 0.5);
}

.avatar-status {
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
}

.connecting-status {
  display: flex;
  align-items: center;
  color: #e6a23c;
}

.speaking-status {
  display: flex;
  align-items: center;
  color: #409eff;
  animation: pulse 1.5s infinite;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #409eff;
  margin-right: 5px;
  animation: pulse 1.5s infinite;
}

.status-dot.idle {
  background-color: #67c23a;
  animation: none;
}

.idle-status {
  display: flex;
  align-items: center;
  color: #67c23a;
}

.video-history {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.video-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-item video {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
}

.video-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
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
  position: relative;
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
  white-space: pre-wrap;
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

.button-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@keyframes pulse {
  0% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.3; transform: scale(0.8); }
}
</style> 