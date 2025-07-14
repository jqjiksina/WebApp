<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="interview-container">
    <el-card class="interview-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>AI面试助手</span>
            <el-button type="primary" @click="onShowSessionList">
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
                @click="chatHistory.switchToSession(session.session_id)"
              >
                <div class="session-title">{{ session.title }}</div>
                <div class="session-time">{{ formatTime(session.updated_at as number) }}</div>
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
              <div v-else-if="!digitalPersonSessionId">
                <span class="status-dot closed"></span> 连接关闭
              </div>
              <div v-else class="idle-status">
                <span class="status-dot idle"></span> 已连接
              </div>
            </div>
            <div class="avatar-selection">
              <div v-if="peerConnection?.connectionState==='closed' || peerConnection?.connectionState==undefined || peerConnection?.connectionState==null">
                <!--重置连接 -->
                <el-button    
                  type="primary"
                  @click="beginInterview">
                  连接Ai面试官
                </el-button>
              </div>
              <div v-else>
                <el-button
                  type="primary"
                  @click="endInterview">
                  断开连接
                </el-button>
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
              <el-button
                type="primary"
                :icon="isRecording ? VideoPause : Microphone"
                @click="toggleRecording"
                :class="{ 'recording': isRecording }"
              >
                {{ isRecording ? '停止录音' : '语音输入' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="Interview">
import { ref, onBeforeUnmount, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Microphone, VideoPause } from '@element-plus/icons-vue'
import { ChatHistoryManager, ChatSessionUpdated } from '@/utils/chatHistory'
import type { ChatMessage } from '@/api/resumeApi'
import { interviewApi } from '@/api/interviewApi'
// import axios from 'axios'
import axios from "axios"
// import { useUsersStore } from '@/store'

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
const digitalPersonSessionId = ref()

const sessions = computed(() => chatHistory.getAllSessions().value)

const userAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const aiAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

const onShowSessionList = async () =>{
  showSessionList.value = !showSessionList.value
  if (showSessionList.value){
    const response = await interviewApi.listSession("");
    chatHistory.updateSession(response.data as ChatSessionUpdated[])
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// 删除指定会话
const deleteSession = async (session_id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个面试记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    interviewApi.deleteSession([session_id])
    chatHistory.deleteSession(session_id)
    activeSessionId.value=""
    ElMessage.success('面试记录已删除')
  } catch {
    // 用户取消删除
  }
}

/**
 * 创建临时新会话
 *  */ 
const createNewSession = async () => {
  activeSessionId.value = ""
  messages.value = []
  showSessionList.value = false
  if (peerConnection.value?.connectionState==="connected"){
    const response = await interviewApi.chat("open log","")
    chatHistory.switchToSession(response.data.session_id)
  }
}

/**
 * 创建webRTC连接，连接过程中的身份验证应由数字人项目完成（数字人项目被后端分发token，数字人项目使用被分发的token，对用户身份进行验证）
 */
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

    const response = await axios.post('http://' + import.meta.env.VITE_BACK_END_URL + "/digitalperson/offer",{
      sdp: peerConnection.value.localDescription?.sdp,
      type: 'offer'
    })
    
    if (response.status != 200) {
      throw new Error(`无法连接到数字人服务: ${response}`)
    }
    
    const answerData = response.data;
    console.log('收到WebRTC应答:', answerData)
    
    if (!answerData.sdp || !answerData.type || !answerData.sessionid) {
      throw new Error('WebRTC应答格式不正确，缺少必要参数') 
    }
    
    digitalPersonSessionId.value = answerData.sessionid

    console.log('数字人会话id:', digitalPersonSessionId.value)
    
    const remoteDesc = new RTCSessionDescription({
      sdp: answerData.sdp,
      type: answerData.type as RTCSdpType
    })
    await peerConnection.value.setRemoteDescription(remoteDesc)



    console.log("[Debug] 设置数字人会话id完毕:",digitalPersonSessionId.value)
    console.log('WebRTC连接创建成功')
  } catch (error) {
    console.error('创建WebRTC连接失败:', error)
    connecting.value = false
    ElMessage.error('连接数字人失败，请稍后再试')
  }
}

// 语音识别相关状态
const isRecording = ref(false)
const recognition = ref<SpeechRecognition | null>(null)
const silenceTimer = ref<number | null>(null)
const silenceThreshold = 1500 // 1.5秒静音判定
const finalTranscript = ref('')
const interimTranscript = ref('')

// 初始化语音识别
const initSpeechRecognition = async () => {
  try {
    // 检查浏览器是否支持getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      ElMessageBox.alert(
        '您的浏览器不支持或禁用了麦克风访问。请按以下步骤操作：\n\n' +
        '1. 确保使用最新版本的Chrome、Edge或Firefox浏览器\n' +
        '2. 检查浏览器地址栏是否有麦克风权限图标\n' +
        '3. 点击地址栏左侧的锁定图标，确保麦克风权限已允许\n' +
        '4. 如果仍然无法使用，请尝试在浏览器设置中重置网站权限',
        '麦克风访问失败',
        {
          confirmButtonText: '我知道了',
          type: 'warning'
        }
      )
      return
    }

    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop()) // 获取权限后立即停止流

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.value = new SpeechRecognition()
      recognition.value.continuous = true
      recognition.value.interimResults = true
      recognition.value.lang = 'zh-CN'

      recognition.value.onstart = () => {
        isRecording.value = true
        finalTranscript.value = ''
        interimTranscript.value = ''
        ElMessage.success('语音识别已启动')
      }

      recognition.value.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            final += transcript
          } else {
            interim += transcript
          }
        }

        finalTranscript.value = final
        interimTranscript.value = interim
        inputMessage.value = final + interim

        // 重置静音计时器
        if (silenceTimer.value) {
          clearTimeout(silenceTimer.value)
        }
        silenceTimer.value = window.setTimeout(() => {
          if (finalTranscript.value) {
            sendMessage()
          }
        }, silenceThreshold)
      }

      recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('语音识别错误:', event.error)
        if (event.error === 'not-allowed') {
          ElMessageBox.alert(
            '请允许网页使用麦克风。\n\n' +
            '1. 点击地址栏左侧的锁定图标\n' +
            '2. 找到"麦克风"选项\n' +
            '3. 选择"允许"',
            '需要麦克风权限',
            {
              confirmButtonText: '我知道了',
              type: 'warning'
            }
          )
        } else {
          ElMessage.error('语音识别失败，请重试')
        }
        isRecording.value = false
      }

      recognition.value.onend = () => {
        isRecording.value = false
        // 如果还有未发送的内容，发送它
        if (finalTranscript.value) {
          sendMessage()
        }
      }

      // 自动开始录音
      startRecording()
    } else {
      ElMessageBox.alert(
        '您的浏览器不支持语音识别功能。\n\n' +
        '请使用最新版本的Chrome、Edge或Firefox浏览器。',
        '浏览器不支持',
        {
          confirmButtonText: '我知道了',
          type: 'warning'
        }
      )
    }
  } catch (error) {
    console.error('获取麦克风权限失败:', error)
    ElMessageBox.alert(
      '获取麦克风权限失败。\n\n' +
      '请按以下步骤操作：\n' +
      '1. 确保使用最新版本的Chrome、Edge或Firefox浏览器\n' +
      '2. 检查浏览器地址栏是否有麦克风权限图标\n' +
      '3. 点击地址栏左侧的锁定图标，确保麦克风权限已允许\n' +
      '4. 如果仍然无法使用，请尝试在浏览器设置中重置网站权限',
      '麦克风访问失败',
      {
        confirmButtonText: '我知道了',
        type: 'warning'
      }
    )
  }
}

// 开始录音
const startRecording = () => {
  if (recognition.value) {
    try {
      recognition.value.start()
      isRecording.value = true
    } catch (error) {
      console.error('启动语音识别失败:', error)
    }
  }
}

// 停止录音
const stopRecording = () => {
  if (recognition.value) {
    recognition.value.stop()
    isRecording.value = false
  }
  if (silenceTimer.value) {
    clearTimeout(silenceTimer.value)
    silenceTimer.value = null
  }
}

// 切换录音状态
const toggleRecording = () => {
  if (!recognition.value) {
    initSpeechRecognition()
  }

  if (isRecording.value) {
    recognition.value?.stop()
  } else {
    try {
      recognition.value?.start()
      isRecording.value = true
      ElMessage.success('开始录音')
    } catch (error) {
      console.error('启动语音识别失败:', error)
      ElMessage.error('启动语音识别失败')
    }
  }
}

const beginInterview = async ()=>{
  await createWebRTCConnection();
  // 创建webrtc链接成功后，将所连接的数字人会话id传到后端。
  await interviewApi.setHumanSessionId(digitalPersonSessionId.value)
  // and then activate the open log
  const response = await interviewApi.chat("open log","")
  chatHistory.switchToSession(response.data.session_id)
  await initSpeechRecognition();
}

const endInterview = ()=>{
  stopRecording();
  if (silenceTimer.value) {
    clearTimeout(silenceTimer.value)
  }
  cleanupWebRTC();
}

// 组件卸载时清理资源
onBeforeUnmount(() => {
  endInterview();
})

const cleanupWebRTC = () => {
  if (digitalPersonSessionId.value) {
    try {
      // 清理本地状态
      digitalPersonSessionId.value = null
      if (peerConnection.value) {
        peerConnection.value.close()
        peerConnection.value = null
      }
      console.log("[Debug] 清理WebRTC连接完毕")
    } catch (error) {
      console.error('清理WebRTC连接失败:', error)
    }
  }
}

// 监听页面卸载事件
window.addEventListener('beforeunload', () => {
  cleanupWebRTC()
})

// 修改发送消息函数
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  let thisSessionId = activeSessionId.value;
  
  const userMessage: ChatMessage = {
    role: 'user',
    content: inputMessage.value.trim(),
  }
  messages.value.push(userMessage)
  await chatHistory.scrollToBottom()

  if (thisSessionId)
    chatHistory.saveSession(thisSessionId)
  
  // 清空输入框和语音识别结果
  inputMessage.value = ''
  finalTranscript.value = ''
  interimTranscript.value = ''
  
  try {
    console.log("[Debug] 开始发送消息于会话:", thisSessionId)
    const response = await interviewApi.chat(userMessage.content, thisSessionId)
    console.log("[Debug] sendMessage Response:", response)

    if (response.status != 200)
      throw new Error(response.statusText);
    
    if (thisSessionId != response.data.session_id) {
      chatHistory.createSession(response.data.session_id, "面试会话")
      chatHistory.saveSession(response.data.session_id)
      if (thisSessionId)
        chatHistory.deleteSession(thisSessionId)
    }
    
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请重试')
  }
}

// 添加Web Speech API的类型声明
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
  interpretation: any
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: () => void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
  start: () => void
  stop: () => void
  abort: () => void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}
</script>

<style scoped>
.interview-container {
  padding: 10px;
  height: 100%;
  width: 100%;
  overflow: auto;
}

.interview-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
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

.avatar-selection{
  margin-top: 10px;
  display: flex;
  flex-direction: row;
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

.status-dot.closed{
  background-color: #f56c6c;
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
  /* min-height: 50vh; */
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

.recording {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

.recording:hover {
  background-color: #f78989;
  border-color: #f78989;
}
</style> 