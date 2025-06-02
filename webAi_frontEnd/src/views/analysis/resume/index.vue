<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="resume-container">
    <el-card class="resume-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>简历修改助手</span>
            <el-button type="primary" @click="showSessionList = !showSessionList">
              {{ showSessionList ? '隐藏会话列表' : '显示会话列表' }}
            </el-button>
            <!-- <el-button type="primary" @click="toggleAvatarMode">
              {{ showAvatar ? '隐藏数字人' : '显示数字人' }}
            </el-button> -->
          </div>
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

      <div class="chat-layout">
        <!-- 会话列表 -->
        <div v-if="showSessionList" class="session-list">
          <div class="session-list-header">
            <h3>历史会话</h3>
            <el-button type="text" @click="createNewSession">新建会话</el-button>
          </div>
          <el-scrollbar>
            <div class="session-items">
              <div
                v-for="session in sessions"
                :key="session.session_id"
                class="session-item"
                :class="{ active: session.session_id === activeSessionId, 'is-streaming': isSessionStreaming(session.session_id) }"
                @click="switchToSession(session.session_id)"
              >
                <div class="session-title">{{ session.title }}</div>
                <div class="session-time">{{ formatTime(session.updated_at as number) }}</div>
                <div v-if="isSessionStreaming(session.session_id)" class="streaming-indicator">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
                <el-button
                  type="text"
                  class="delete-session"
                  @click.stop="deleteSession(session.session_id)"
                  :disabled="isSessionStreaming(session.session_id)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </el-scrollbar>
        </div>

        <!-- 聊天区域 -->
        <div class="chat-container">
          <div class="chat-messages" ref="messagesContainer">
            <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
              <div class="message-content">
                <div class="message-header">
                  <el-avatar :size="32" :src="message.role === 'user' ? userAvatar : aiAvatar" />
                  <span class="message-role">{{ message.role === 'user' ? '我' : '简历助手' }}</span>
                </div>
                <div class="message-text" v-html="message.content" :class="{'message-stream': message.role === 'assistant' && ((isStreaming && index === messages.length - 1))}"></div>
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
              :disabled="isStreaming"
            />
            <div class="button-container">
            <el-button 
              type="primary" 
              @click="sendMessage" 
                :loading="isStreaming"
              :disabled="isStreaming"
            >发送</el-button>
              <el-button
                type="danger"
                @click="stopStreamming"
                v-if="isStreaming"
                >停止</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="ResumeChat">
import { ref, onMounted, computed, onBeforeUnmount, } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { resumeApi } from '@/api/resume/resumeApi'
import { ChatHistoryManager } from '@/utils/chatHistory'
import type { ChatMessage } from '@/types/resume'

const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const activeSessionId = ref("")
const showSessionList = ref(false)
const chatHistory = new ChatHistoryManager('resume')
chatHistory.setChatContext(messages,messagesContainer,activeSessionId,inputMessage)

const isStreaming = computed(() => chatHistory.isSessionStreaming(activeSessionId.value).value)
const sessions = computed(() => chatHistory.getAllSessions().value)

const userAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const aiAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

const stopStreamming = () => {  //停止接受
  if (isStreaming.value) {
    chatHistory.stopSessionStreaming(activeSessionId.value);
    chatHistory.removeAllSessionListeners(activeSessionId.value);
    chatHistory.saveSession(activeSessionId.value);
    // 中断chat函数发出的流式传输连接
    resumeApi.abortChat(activeSessionId.value);
    ElMessage.info('流式传输已中断');
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// 检查会话是否正在流式接收
const isSessionStreaming = (session_id: string) => {
  return chatHistory.isSessionStreaming(session_id).value
}

const switchToSession = async (sessionId: string) => {
  chatHistory.switchToSession(sessionId)
}

// 删除会话
const deleteSession = async (session_id: string) => {
  if (chatHistory.isSessionStreaming(session_id).value) {
    ElMessage.warning('无法删除正在进行的会话')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要删除这个会话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    chatHistory.deleteSession(session_id)
    
    ElMessage.success('会话已删除')
  } catch {
    // 用户取消删除
  }
}

/** 创建临时新会话，如果没发送消息，实际没有创建新会话到历史记录，仅仅是发送欢迎语
 * 在调用chat时才会真正创建新会话
 *  */ 
const createNewSession = () => {
  activeSessionId.value = ""  // 标记当前会话是临时会话，需要调用chat才会创建新会话
  messages.value = []
  chatHistory.showWelcomeMessage()
  showSessionList.value = false
}

// // 创建WebRTC连接
// const createWebRTCConnection = async () => {
//   try {
//     connecting.value = true
//     console.log('开始创建WebRTC连接...')
    
//     // 创建PeerConnection
//     peerConnection.value = new RTCPeerConnection({
//       iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
//     })
    
//     // 监听ICE候选
//     peerConnection.value.onicecandidate = event => {
//       if (event.candidate) {
//         console.log('发现新的ICE候选:', event.candidate)
//       }
//     }
    
//     // 处理远程流
//     peerConnection.value.ontrack = event => {
//       if (avatarVideo.value && event.streams[0]) {
//         console.log('收到远程视频流')
//         avatarVideo.value.srcObject = event.streams[0]
//         connecting.value = false
//       }
//     }
    
//     // 创建offer
//     const offer = await peerConnection.value.createOffer({
//       offerToReceiveVideo: true,
//       offerToReceiveAudio: true
//     })
    
//     await peerConnection.value.setLocalDescription(offer)
    
//     // 发送offer到服务器，获取answer
//     if (!peerConnection.value.localDescription) {
//       throw new Error('本地描述为空')
//     }
//     const response = await fetch(`${digitalPersonAPI}/offer`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         sdp: peerConnection.value.localDescription.sdp,
//         type: 'offer'
//       })
//     })
    
//     if (!response.ok) {
//       const errorData = await response.json()
//       if (response.status === 429) {
//         ElMessage.error('数字人服务已达到最大会话数限制，请稍后再试')
//       } else {
//         throw new Error(`无法连接到数字人服务: ${errorData.msg || response.statusText}`)
//       }
//       return
//     }
    
//     const answerData = await response.json()
//     console.log('收到WebRTC应答:', answerData)
    
//     if (!answerData.sdp || !answerData.type || !answerData.sessionid) {
//       throw new Error('WebRTC应答格式不正确，缺少必要参数')
//     }
    
//     // 保存会话ID
//     sessionId.value = answerData.sessionid
    
//     // 创建远程描述
//     const remoteDesc = new RTCSessionDescription({
//       sdp: answerData.sdp,
//       type: answerData.type
//     })
//     await peerConnection.value.setRemoteDescription(remoteDesc)
    
//     console.log('WebRTC连接创建成功')
    
//     // 连接成功后发送一条欢迎消息
//     setTimeout(async () => {
//       if (showAvatar.value) {
//         await sendTextToDigitalPerson('你好，我是您的简历助手。点击"显示数字人"按钮可以切换我的显示状态。')
//       }
//     }, 1000)
//   } catch (error) {
//     console.error('创建WebRTC连接失败:', error)
//     connecting.value = false
//     ElMessage.error('连接数字人失败，请稍后再试')
//   }
// }

// // 检查数字人是否在说话
// const checkIsSpeaking = async () => {
//   try {
//     const response = await fetch(`${digitalPersonAPI}/is_speaking`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ sessionid: sessionId.value })
//     })
    
//     if (!response.ok) {
//       throw new Error(`检查说话状态失败: ${response.status} ${response.statusText}`)
//     }
    
//     const data = await response.json()
//     console.log('数字人说话状态:', data)
//     return data.is_speaking === true
//   } catch (error) {
//     console.error('检查数字人说话状态失败:', error)
//     return false
//   }
// }

// // 定期检查数字人说话状态
// let speakingCheckInterval: number | null = null

// // 发送文本给数字人
// const sendTextToDigitalPerson = async (text: string) => {
//   try {
//     console.log(`向数字人发送文本: "${text}"`)
    
//     // 检查数字人连接是否已建立
//     if (!peerConnection.value || peerConnection.value.connectionState !== 'connected') {
//       console.warn('数字人WebRTC连接未建立或状态异常')
//       // 尝试重新建立连接
//       if (showAvatar.value) {
//         await createWebRTCConnection()
//       }
//     }
    
//     const response = await fetch(`${digitalPersonAPI}/human`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         sessionid: sessionId.value,
//         type: 'chat',
//         text: text,
//         interrupt: false
//       })
//     })
    
//     if (!response.ok) {
//       throw new Error(`发送文本到数字人失败: ${response.status} ${response.statusText}`)
//     }
    
//     const result = await response.json()
//     console.log('数字人API响应:', result)
    
//     // 设置为正在说话状态
//     isSpeaking.value = true
    
//     // 开始检查说话状态
//     if (speakingCheckInterval) {
//       clearInterval(speakingCheckInterval)
//     }
    
//     speakingCheckInterval = window.setInterval(async () => {
//       try {
//         const speaking = await checkIsSpeaking()
//         isSpeaking.value = speaking
        
//         if (!speaking) {
//           console.log('数字人已停止说话')
//           clearInterval(speakingCheckInterval!)
//           speakingCheckInterval = null
//         }
//       } catch (error) {
//         console.error('检查数字人说话状态失败:', error)
//         clearInterval(speakingCheckInterval!)
//         speakingCheckInterval = null
//         isSpeaking.value = false
//       }
//     }, 1000)
    
//   } catch (error) {
//     console.error('向数字人发送文本失败:', error)
//     isSpeaking.value = false
//     ElMessage.warning('数字人服务暂时不可用')
//   }
// }

// // 监视数字人显示状态
// watch(showAvatar, async (newValue) => {
//   if (newValue) {
//     // 显示数字人时，创建WebRTC连接
//     await createWebRTCConnection()
//   } else {
//     // 隐藏数字人时，关闭连接
//     if (peerConnection.value) {
//       peerConnection.value.close()
//       peerConnection.value = null
//     }
    
//     if (speakingCheckInterval) {
//       clearInterval(speakingCheckInterval)
//       speakingCheckInterval = null
//     }
    
//     isSpeaking.value = false
//     connecting.value = false
//   }
// })

// // 监听消息内容变化，在数字人模式下让数字人播报助手回复
// watch(() => messages.value[messages.value.length - 1]?.content, async (newContent, oldContent) => {
//   if (showAvatar.value && 
//       messages.value.length > 0 && 
//       messages.value[messages.value.length - 1]?.role === 'assistant' && 
//       newContent && 
//       newContent !== oldContent && 
//       !isStreaming.value) {
//     // 当助手消息完整显示后，让数字人播报内容
//     // 移除HTML标签，获取纯文本
//     const plainText = newContent.replace(/<[^>]*>/g, '')
    
//     if (useDirectConnection.value) {
//       // 方案1: 直接API调用
//       await sendTextToDigitalPerson(plainText)
//     } else {
//       // 方案2: 通过iframe发送消息
//       sendMessageToIframe(plainText)
//     }
//   }
// })

// // 通过iframe向数字人发送消息
// const sendMessageToIframe = (text: string) => {
//   const iframe = document.querySelector('.iframe-container iframe') as HTMLIFrameElement
//   if (iframe && iframe.contentWindow) {
//     console.log(`通过iframe向数字人发送消息: "${text}"`)
    
//     // 使用postMessage发送消息到iframe
//     try {
//       iframe.contentWindow.postMessage({
//         type: 'chat',
//         text: text,
//         sessionid: 0
//       }, '*') // 使用'*'允许任何来源，但在生产环境中应该指定确切的目标源
      
//       ElMessage.success('消息已发送给数字人')
//     } catch (error) {
//       console.error('向iframe发送消息失败:', error)
//       ElMessage.warning('无法向数字人发送消息')
//     }
//   } else {
//     console.warn('找不到数字人iframe')
//     ElMessage.warning('数字人界面未就绪')
//   }
// }

/**
 * 核心逻辑，处理对话发送和接收
 */
const handleChat = async () => {
  if (!inputMessage.value.trim()) return
  console.log("开始处理对话")

  // 保存用户输入内容
  const userMessageContent = inputMessage.value.trim()
  
  // 添加用户消息
  const userMessage: ChatMessage = {
    role: 'user',
    content: userMessageContent,
  }
  messages.value.push(userMessage)

  // 清空输入框
  inputMessage.value = ''

  // 添加AI消息占位
  const aiMessage: ChatMessage = {
    role: 'assistant',
    content: '',
  }
  messages.value.push(aiMessage)
  chatHistory.scrollToBottom()

  let initialSessionId = activeSessionId.value
  // 如果没有会话ID，先创建新会话
  if (!initialSessionId) {
    try {
      // 发送初始请求创建会话
      initialSessionId = await resumeApi.createNewSession()
      if (initialSessionId) {
        activeSessionId.value = initialSessionId
        // 创建新会话并保存用户消息
        chatHistory.createSession(initialSessionId, userMessageContent.substring(0, 30) + '...')
        chatHistory.addMessage(initialSessionId, userMessage)
        
        console.log('创建新会话:', initialSessionId)
      }
    } catch (error) {
      console.error('创建会话失败:', error)
      messages.value[messages.value.length - 1].content = '创建会话失败，请重试'
      return
    }
  } else {
    // 保存用户消息到现有会话
    chatHistory.addMessage(initialSessionId, userMessage)
  }

  try {
    // 创建会话特定的处理器
    chatHistory.createMessageHandler(initialSessionId)
    
    // 标记会话为流式状态
    chatHistory.startSessionStreaming(initialSessionId)
    chatHistory.resetTypingIndex(initialSessionId)
    
    // 保存当前会话状态
    chatHistory.saveSession(initialSessionId)
    
    // 发送请求前确保会话ID正确
    console.log(`发送聊天请求，会话ID: ${initialSessionId}`)
    
    // 发送请求
    const session_id = await resumeApi.chat(initialSessionId, userMessageContent)
    
    // 更新会话ID（如果有变化）
    if (session_id && session_id !== initialSessionId) {
      console.log(`会话ID更新: ${initialSessionId} -> ${session_id}`)
    }
    
    console.log("聊天完成，返回会话ID:", session_id)
  } catch (error) {
    console.error('对话失败:', error)
    chatHistory.stopSessionStreaming(initialSessionId)
  }
}

// 监听iframe中数字人状态的消息
onMounted(() => {
  chatHistory.loadSession()
  if (messages.value.length === 0) {
    chatHistory.showWelcomeMessage()
  }
})

// 组件卸载前清理资源
onBeforeUnmount(() => {
  console.log("resume component unmounted!")
  // 清理所有活跃的消息处理器
  chatHistory.clearEvnetListeners()
  chatHistory.clearSessionsStreaming()
  
})

/**
 * 发送消息
 */
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return
  
  // 如果当前会话正在流式接收，不允许发送新消息
  if (activeSessionId.value && chatHistory.isSessionStreaming(activeSessionId.value).value) {
    ElMessage.warning('请等待当前回复完成')
    return
  }
  
  try {
    await handleChat()
  } finally {
  }
}

// 处理文件上传
const handleUploadSuccess = async (_response: any) => {
  ElMessage.success('简历上传成功')
  try {
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: '我已经收到您的简历，我可以帮您：\n1. 分析简历内容\n2. 提供修改建议\n3. 优化表达方式\n4. 调整格式结构\n\n请告诉我您想先从哪个方面开始？',
    }
    messages.value.push(welcomeMessage)
    
    if (activeSessionId.value) {
      chatHistory.addMessage(activeSessionId.value, welcomeMessage)
    }
  } catch (error) {
    console.error("[Debug] handleUploadSuccess error:", error)
    ElMessage.error('初始化对话失败')
  } finally {
    chatHistory.scrollToBottom()
  }
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

<style scoped>
.resume-container {
  padding: 20px;
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

.session-item.is-streaming {
  border-left: 3px solid #409eff;
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

.streaming-indicator {
  position: absolute;
  right: 30px;
  top: 10px;
  display: flex;
  gap: 3px;
  align-items: center;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: #409eff;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.5s;
}

.dot:nth-child(3) {
  animation-delay: 1s;
}

@keyframes pulse {
  0% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.3; transform: scale(0.8); }
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
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

:deep(.el-upload) {
  display: inline-block;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 打字机效果 */
@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}

.message-stream::after {
  content: '|';
  animation: blink 1s infinite;
  margin-left: 2px;
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: #409eff;
  vertical-align: middle;
}

.button-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 数字人相关样式 */
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

.avatar-controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
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

.iframe-container {
  width: 100%;
  height: 450px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
}

.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.avatar-note {
  margin-top: 10px;
  text-align: center;
  color: #606266;
  font-size: 14px;
}

.webrtc-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
