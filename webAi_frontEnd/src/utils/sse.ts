import { useUsersStore } from '@/store'

const store = useUsersStore()

export class SSEClient {
    private eventSource: EventSource | null = null
    private messageCallback: ((data: any) => void) | null = null
    private errorCallback: ((error: Event) => void) | null = null
    private endCallback: (() => void) | null = null
  
    constructor(url: string) {
      // 添加认证头
      const token = store.getToken
      const urlWithAuth = new URL(url)
      urlWithAuth.searchParams.append('token', token)
      
      this.eventSource = new EventSource(urlWithAuth.toString())
      this.setupEventListeners()
    }
  
    private setupEventListeners() {
      if (!this.eventSource) return
  
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (this.messageCallback) {
            this.messageCallback(data)
          }
        } catch (error) {
          console.error('解析SSE数据失败:', error)
        }
      }
  
      this.eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error)
        if (this.errorCallback) {
          this.errorCallback(error)
        }
        this.close()
      }
    }
  
    onMessage(callback: (data: any) => void) {
      this.messageCallback = callback
    }
  
    onError(callback: (error: Event) => void) {
      this.errorCallback = callback
    }
  
    onEnd(callback: () => void) {
      this.endCallback = callback
    }
  
    close() {
      if (this.eventSource) {
        this.eventSource.close()
        this.eventSource = null
      }
      if (this.endCallback) {
        this.endCallback()
      }
    }
  }