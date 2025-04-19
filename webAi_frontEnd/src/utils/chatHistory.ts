import { useUsersStore } from '@/store'
import type { ChatHistory, ChatSession, ChatMessage, ChatSessionState } from '@/types/resume'
import { ElMessage } from 'element-plus'
import { nextTick, ref, Ref } from 'vue'

const STORAGE_KEY = `${useUsersStore().username}-resume_chat_history`

export class ChatHistoryManager {
  private static instance: ChatHistoryManager
  private history: ChatHistory
  private activeStreamingSessions: Set<string> = new Set()
  private eventListeners: Map<string, Set<EventListener>> = new Map()
  // private mode : string = "resume"

  //上下文
  private messages : Ref<ChatMessage[]> = ref([])
  private messagesContainer = ref<HTMLElement | null>(null)
  private active_session_id = ref("")

  private constructor() {
    this.history = this.loadHistory()
    // 初始化状态
    this.initializeSessionStates()
  }

  public static getInstance(): ChatHistoryManager {
    if (!ChatHistoryManager.instance) {
      ChatHistoryManager.instance = new ChatHistoryManager()
    }
    return ChatHistoryManager.instance
  }

  private initializeSessionStates() {
    // 确保每个会话都有状态对象
    if (this.history.sessions) {
      this.history.sessions.forEach(session => {
        if (!session.state) {
          session.state = this.createDefaultSessionState()
        }
      })
    }
  }

  private loadHistory(): ChatHistory {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse chat history:', e)
      }
    }
    return {
      sessions: [],
      current_session_id: null
    }
  }

  private saveHistory() {
    try {
      // 保存前进行深拷贝，避免引用问题
      const historyToSave = JSON.parse(JSON.stringify(this.history));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historyToSave));
      console.log("历史记录已保存，会话数量:", this.history.sessions.length);
    } catch (error) {
      console.error("保存历史记录失败:", error);
    }
  }

  private createDefaultSessionState(): ChatSessionState {
    return {
      typingIndex: -1,
      isStreaming: false,
      lastContent: ''
    }
  }

  // 获取会话的上下文
  public setChatContext(messages : Ref<ChatMessage[]>,
    messagesContainer:Ref<HTMLElement | null>,
    active_session_id : Ref<string>
  ){
    this.messages = messages
    this.messagesContainer = messagesContainer
    this.active_session_id = active_session_id
  }
  /**
 * 打字机效果 - 针对特定会话
 * @param session_id 会话ID
 * @param text 要显示的完整文本
 * @param startIndex 开始打字的位置
 */
  private typeWriter(session_id: string, text: string, startIndex: number){
    if (!text) {
      console.warn(`打字机效果: 会话 ${session_id} 的文本为空`);
      return;
    }
    
    // 确保文本是字符串
    const content = String(text);
    
    // 获取当前打字索引
    let currentIndex = Math.max(this.getTypingIndex(session_id), startIndex);
    
    // 已完成打字或超出范围
    if (currentIndex >= content.length) {
      return;
    }
    
    // 更新会话状态的打字索引
    this.updateSessionState(session_id, { 
      typingIndex: currentIndex,
      lastContent: content  // 同时保存完整内容
    });
    
    // 只有当前活跃会话才更新UI
    if (this.active_session_id.value === session_id && this.messages.value?.length > 0) {
      const lastMessage = this.messages.value[this.messages.value.length - 1];
      
      if (lastMessage?.role === 'assistant') {
        // 更新显示的内容
        lastMessage.content = content.substring(0, currentIndex + 1);
        this.scrollToBottom();
      }
    }
    
    // 继续下一个字符
    setTimeout(() => {
      // 检查会话是否仍在流式接收
      if (this.isSessionStreaming(session_id)) {
        // 递归调用以处理下一个字符
        this.typeWriter(session_id, content, currentIndex + 1);
      } else if (this.active_session_id.value === session_id) {
        // 会话结束时确保显示完整内容
        const lastMessage = this.messages.value[this.messages.value.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage.content !== content) {
          lastMessage.content = content;
          this.scrollToBottom();
        }
      }
    }, 20); // 调整打字速度
  }

  public createSession(session_id: string, title: string): ChatSession {
    const now = Date.now()
    const newSession: ChatSession = {
      session_id,
      messages: [],
      created_at: now,
      updated_at: now,
      title,
      state: this.createDefaultSessionState()
    }
    this.history.sessions.push(newSession)
    this.active_session_id.value = this.history.current_session_id = session_id
    this.saveHistory()
    return newSession
  }

  public addMessage(session_id: string, message: ChatMessage) {
    const session = this.history.sessions.find(s => s.session_id === session_id)
    if (session) {
      session.messages.push(message)
      session.updated_at = Date.now()
      this.saveHistory()
    }
  }

  public getCurrentSession(): ChatSession | null {
    if (!this.history.current_session_id) return null
    return this.history.sessions.find(s => s.session_id === this.history.current_session_id) || null
  }

  public getSession(session_id: string): ChatSession | null {
    return this.history.sessions.find(s => s.session_id === session_id) || null
  }

  public getAllSessions(): ChatSession[] {
    return this.history.sessions.sort((a, b) => b.updated_at - a.updated_at)
  }

  public switchSession(session_id: string) {
    if (this.history.sessions.some(s => s.session_id === session_id)) {
      this.active_session_id.value = this.history.current_session_id = session_id
      this.saveHistory()
    }
  }

  public async switchToSession(sessionId: string){
    console.log('切换到会话:', sessionId)
    
    // 如果当前有活跃会话，保存当前会话状态
    if (this.active_session_id.value) {
      this.saveSession(this.active_session_id.value)
    }
    
    // 更新当前会话ID
    this.active_session_id.value = sessionId
    
    // 获取会话消息并更新显示
    const session = this.getSession(sessionId)
    if (session) {
      this.messages.value = [...session.messages]
      
      // 重置打字索引
      this.resetTypingIndex(sessionId)
      
      console.log('加载会话消息:', this.messages.value.length, '条消息')
    } else {
      this.messages.value = []
      console.log('创建新会话')
    }
  }

  public deleteSession(session_id: string) {
    // 如果会话正在接收消息，先停止它
    if (this.isSessionStreaming(session_id)) {
      this.stopSessionStreaming(session_id)
    }
    
    this.history.sessions = this.history.sessions.filter(s => s.session_id !== session_id)
    if (this.history.current_session_id === session_id) {
      this.history.current_session_id = this.history.sessions[0]?.session_id || null
      if (this.history.current_session_id){
        this.active_session_id.value = this.history.current_session_id
        this.loadSession()
      }
      else{
        this.active_session_id.value = ""
        this.messages.value = []
        this.showWelcomeMessage()
      }
    }
    this.saveHistory()
  }
  
  public showWelcomeMessage = (content ?: string) => {
    let add_content = content
    if (!add_content)
      add_content = '您好！我是您的简历修改助手。\n\n您可以：\n1. 直接上传 Word 格式的简历\n2. 告诉我您想修改的内容\n3. 询问简历相关的任何问题\n\n我会为您提供专业的建议和指导。'
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: add_content,
      timestamp: Date.now()
    }
    this.messages.value.push(welcomeMessage)
  }

  // 获取会话状态
  public getSessionState(session_id: string): ChatSessionState | null {
    const session = this.getSession(session_id)
    return session ? session.state : null
  }

  // 更新会话状态
  public updateSessionState(session_id: string, updates: Partial<ChatSessionState>) {
    const session = this.getSession(session_id)
    if (session) {
      session.state = { ...session.state, ...updates }
      this.saveHistory()
    }
  }

  // 获取打字索引
  public getTypingIndex(session_id: string): number {
    const state = this.getSessionState(session_id)
    return state ? state.typingIndex : -1
  }

  // 更新打字索引
  public updateTypingIndex(session_id: string, index: number) {
    this.updateSessionState(session_id, { typingIndex: index })
  }

  // 获取会话是否正在流式接收
  public isStreaming(session_id: string): boolean {
    const state = this.getSessionState(session_id)
    return state ? state.isStreaming : false
  }

  // 标记会话为活跃状态（正在接收流式消息）
  public startSessionStreaming(session_id: string) {
    this.activeStreamingSessions.add(session_id)
    this.updateSessionState(session_id, { isStreaming: true })
  }

  // 取消会话的活跃状态
  public stopSessionStreaming(session_id: string) {
    this.activeStreamingSessions.delete(session_id)
    this.updateSessionState(session_id, { isStreaming: false })
    // 移除该会话的所有事件监听器
    this.removeAllSessionListeners(session_id)
    this.saveHistory()
  }
  // 取消所有会话的活跃状态
  public clearSessionsStreaming() {
    this.activeStreamingSessions.clear()
    this.history.sessions.forEach(session=>{
      session.state.isStreaming = false
    })
    this.clearEvnetListeners()
  }

  // 保存当前会话消息
  public saveSession(session_id: string) {
    try {
      const session = this.getSession(session_id);
      if (!session) {
        console.warn(`保存会话失败: 找不到会话 ${session_id}`);
        return;
      }
      
      // 创建消息的深拷贝
      const messagesToSave = JSON.parse(JSON.stringify(this.messages.value));
      
      // 检查每条消息的内容是否为HTML格式
      messagesToSave.forEach((msg: ChatMessage) => {
        // 确保content是完整的
        if (typeof msg.content !== 'string') {
          console.warn(`消息内容不是字符串:`, msg.content);
          msg.content = String(msg.content || '');
        }
      });
      
      console.log(`保存会话 ${session_id}，消息数量:`, messagesToSave.length);
      session.messages = messagesToSave;
      session.updated_at = Date.now();
      
      // 立即保存历史记录
      this.saveHistory();
    } catch (error) {
      console.error(`保存会话 ${session_id} 失败:`, error);
    }
  }

  public loadSession(){
    console.log(`加载会话 ${this.active_session_id.value} 的历史消息`)
    const currentSession = this.getSession(this.active_session_id.value)
    
    if (currentSession) {
      // 加载会话消息
      this.messages.value = [...currentSession.messages]
      
      // 如果会话正在流式接收，恢复状态
      if (this.isSessionStreaming(this.active_session_id.value)) {
        console.log(`会话 ${this.active_session_id.value} 正在流式接收中`)
        const sessionState = this.getSessionState(this.active_session_id.value)
        
        // 如果有未完成的内容，确保显示最新内容
        if (sessionState && sessionState.lastContent && this.messages.value.length > 0) {
          const lastMessage = this.messages.value[this.messages.value.length - 1]
          if (lastMessage.role === 'assistant') {
            const typingIndex = this.getTypingIndex(this.active_session_id.value)
            if (typingIndex >= 0 && typingIndex < sessionState.lastContent.length) {
              lastMessage.content = sessionState.lastContent.substring(0, typingIndex + 1)
              console.log(`恢复打字效果，索引: ${typingIndex}`)
              
              // 恢复打字机效果
              this.typeWriter(this.active_session_id.value, sessionState.lastContent, typingIndex)
            } else {
              // 显示完整内容
              lastMessage.content = sessionState.lastContent
            }
          }
        }
      }
      
      this.scrollToBottom()
    } else {
      this.messages.value = []
    }
  }


  // 重置打字索引
  public resetTypingIndex(session_id: string) {
    this.updateTypingIndex(session_id, 0)
  }

  // 检查会话是否正在接收流式消息
  public isSessionStreaming(session_id: string): boolean {
    return this.activeStreamingSessions.has(session_id)
  }

  // 添加会话特定的事件监听器
  public addSessionListener(session_id: string, eventName: string, listener: EventListener) {
    const key = `${eventName}-${session_id}`
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set())
    }
    
    this.eventListeners.get(key)?.add(listener)
    window.addEventListener(`${eventName}-${session_id}`, listener)
  }

  /**
 * 移除会话特定的消息处理器
 * @param session_id 会话ID
 * @param eventName 事件名称
 * @param listener  事件处理函数
 */
  public removeSessionListener(session_id: string, eventName: string, listener: EventListener) {
    const key = `${eventName}-${session_id}`
    const listeners = this.eventListeners.get(key)
    
    if (listeners && listeners.has(listener)) {
      listeners.delete(listener)
      window.removeEventListener(`${eventName}-${session_id}`, listener)
    }
  }
  /**
   * 移除特定会话的所有消息处理器
   * @param session_id 
   */
  // 移除会话的所有事件监听器
  public removeAllSessionListeners(session_id: string) {
    for (const [key, listeners] of this.eventListeners.entries()) {
      if (key.endsWith(`${session_id}`)) {
        for (const listener of listeners) {
          window.removeEventListener(key, listener)
        }
      }
    }
    this.eventListeners.clear()
  }

  /**
   * 清除所有消息处理器
   */
  public clearEvnetListeners(){
    for (const [key,eventListeners] of this.eventListeners.entries()){
      for (const listener of eventListeners)
        window.removeEventListener(key,listener)
      this.eventListeners.delete(key)
    }
  }


  /**
   * 跳转到当前上下文消息窗口的底部
   */
  public async scrollToBottom(){
    await nextTick()
    if (this.messagesContainer.value) {
      this.messagesContainer.value.scrollTop = this.messagesContainer.value.scrollHeight
    }
  }
  /**
   * 创建和管理会话特定的消息处理器
   * @param session_id 会话ID
   * @returns 事件处理器对象
   */
  public createMessageHandler = (session_id: string) => {
    // 移除已存在的处理器
    this.removeAllSessionListeners(session_id)
    console.log(`创建会话 ${session_id} 的消息处理器`)
    
    // 消息处理器 - 处理流式数据
    const messageHandler = ((event: CustomEvent) => {
      const data = event.detail;
      let content = '';
      
      // 解析内容
      if (data && data.content) {
        if (typeof data.content === 'object' && data.content.type === 'text') {
          content = data.content.content || '';
        } else if (typeof data.content === 'string') {
          content = data.content;
        }
      }
      
      if (!content) {
        console.warn(`收到会话 ${session_id} 的空消息`);
        return;
      }
      
      // 保存最新内容到会话状态
      this.updateSessionState(session_id, {
        lastContent: content
      });
      
      // 只有当前会话才启动打字机效果
      if (this.active_session_id.value === session_id) {
        const currentIndex = this.getTypingIndex(session_id);
        this.typeWriter(session_id, content, currentIndex >= 0 ? currentIndex : 0);
        this.scrollToBottom();
      }
    }) as EventListener;
    
    // 保存处理器引用并注册
    this.addSessionListener(session_id, "sse-message", messageHandler);
    
    // 完成处理器 - 处理会话结束事件
    const completionHandler = ((event: CustomEvent) => {
      console.log(`会话 ${session_id} 完成接收`);
      
      // 获取完成的内容
      let finalContent = '';
      if (event.detail && event.detail.content) {
        finalContent = typeof event.detail.content === 'string' 
          ? event.detail.content 
          : JSON.stringify(event.detail.content);
      } else {
        // 如果没有结束内容，使用最后保存的内容
        const sessionState = this.getSessionState(session_id);
        finalContent = sessionState?.lastContent || '';
      }
      
      // 创建最终消息
      const finalMessage: ChatMessage = {
        role: "assistant", 
        content: finalContent, 
        timestamp: Date.now()
      };
      
      // 当前活跃会话直接更新UI
      if (session_id === this.active_session_id.value && this.messages.value.length > 0) {
        const lastMessage = this.messages.value[this.messages.value.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = finalContent;
          this.scrollToBottom();
        }
      }
      
      // 无论是否为当前会话，都更新历史
      const session = this.getSession(session_id);
      if (session) {
        // 更新会话中的最后一条消息，如果是助手消息
        if (session.messages.length > 0 && 
            session.messages[session.messages.length - 1].role === 'assistant') {
          session.messages[session.messages.length - 1] = finalMessage;
        } else {
          // 否则添加新消息
          session.messages.push(finalMessage);
        }
        session.updated_at = Date.now();
        
        // 保存更改
        this.saveHistory();
      }
      
      // 停止会话流式接收状态
      this.stopSessionStreaming(session_id);
    }) as EventListener;
    
    this.addSessionListener(session_id, "sse-session-completed", completionHandler);
    
    // 错误处理器 - 处理会话错误
    const errorHandler = ((event: CustomEvent) => {
      console.error(`会话 ${session_id} 出错:`, event.detail);
      
      // 创建错误消息
      const errorMessage = {
        role: 'assistant' as const,
        content: '对话失败，请重试\n[对话中断]',
        timestamp: Date.now()
      };
      
      // 如果是当前会话，更新UI
      if (this.active_session_id.value === session_id && this.messages.value.length > 0) {
        const lastMessage = this.messages.value[this.messages.value.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = errorMessage.content;
        }
        ElMessage.error('对话失败，请重试');
      }
      
      // 更新会话历史
      const session = this.getSession(session_id);
      if (session) {
        if (session.messages.length > 0 && 
            session.messages[session.messages.length - 1].role === 'assistant') {
          session.messages[session.messages.length - 1] = errorMessage;
        } else {
          session.messages.push(errorMessage);
        }
        session.updated_at = Date.now();
        this.saveHistory();
      }
      
      // 停止会话流式接收状态
      this.stopSessionStreaming(session_id);
    }) as EventListener;
    
    this.addSessionListener(session_id, "sse-error", errorHandler);
    
    return {
      messageHandler,
      completionHandler,
      errorHandler
    };
  }
}