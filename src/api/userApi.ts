import axios from "axios";
import type{RegistryParams,LoginParams,LoginResponse} from '@/types/userApi'

export const userApi = {
  login: (params: LoginParams) => axios.post<LoginResponse>('/auth/login', params,{
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 5000 // 设置超时时间（单位：毫秒）
  }),
  register: (params: RegistryParams) => axios.post('auth/registry', params,{
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 5000 // 设置超时时间（单位：毫秒）
  }),
}
