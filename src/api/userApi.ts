import axios from "axios";
import type{RegistryParams,LoginParams,LoginResponse,registerResponse} from '@/types/formSubmit'
import { useUsersStore } from "@/store/user";

export const userApi = {
  login: async (params: LoginParams, timeout_ = 5000) => {
    const response = await axios.post<LoginResponse>(
      'http://' + import.meta.env.VITE_BACK_END_URL +'/auth/login', params,{
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: timeout_ // 设置超时时间（单位：毫秒）
    })
    return response
  },
  register: async (params: RegistryParams, timeout_ = 5000) => {
    const response =  await axios.post<registerResponse>(
      'http://' + import.meta.env.VITE_BACK_END_URL +'/auth/register', params,{
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: timeout_ // 设置超时时间（单位：毫秒）
    })
    return response
  },
  postWithToken: async (params:unknown, targetUrl:string, timeout_ = 5000) => {
    const token = useUsersStore().getToken;
    const response = await axios.post(
      'http://' + targetUrl, params,{
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${token}'
        },
        timeout: timeout_ // 设置超时时间（单位：毫秒）
      }
    )
    return response
  }
}
