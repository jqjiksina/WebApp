import { useUsersStore } from '@/store'
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACK_END_URL,
  timeout: 600000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在这里可以添加 token 等认证信息
    console.log("[Debug] service.interceptors.request:add token!")
    const token = useUsersStore().getToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果是流式响应，直接返回原始响应
    if (response.config.responseType === 'stream') {
      return response
    }
    return response.data
  },
  (error) => {
    // 在这里可以处理错误响应
    return Promise.reject(error)
  }
)

// 定义通用的响应类型
interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

// 封装请求方法
const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.get(url, config)
  },

  post<T>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<ApiResponse<T> | AxiosResponse> {
    return service.post(url, data, config)
  },

  put<T>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.put(url, data, config)
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.delete(url, config)
  }
}

export default request
