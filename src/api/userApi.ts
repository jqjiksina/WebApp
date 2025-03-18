import axios from "axios";
import type{RegistryParams,LoginParams,LoginResponse,registerResponse} from '@/types/formSubmit'
import { useUsersStore } from "@/store/user";

const validate_form = (params: RegistryParams)=>{
  if (params.password_again !== params.password){
    alert('两次密码不相同！')
    return false
  }
  if (params.password.length < 8) {
    alert('密码长度不足!')
    return false
  }
  if(!params.email.includes('@')) {
    alert('邮箱格式不正确!')
    return false
  }
  if(params.phone.length != 11) {
    alert('电话号码格式错误！')
    return false
  }
  if(params.username.length < 3) {
    alert('用户名过短！')
    return false
  }
  if(params.validation_code != 'test'){
    alert('验证码错误！')
    return false
  }
  return true
}

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
    if(!validate_form(params)) return

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
