import axios from "axios";
import type{Request_Login,Response_Login,Response_register, Request_Register} from '@/types/formSubmit'
import { useUsersStore } from "@/store/modules/user";
// import { computed } from "vue";

axios.interceptors.request.use(config => {
  const token = useUsersStore().getToken
  console.log("axio interpret! token: ",token)
  if (token) {
  config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
  });

export const userApi = {
  /**
   * 向后端发送登录请求，携带必要的登录信息
   * @param params Request_Login {username: string, password: string}
   * @param timeout_ 超时时间
   * @returns 登录获得的token和用户信息ACK Response_Login {access_token: string, token_type: string, user_info: {user_id: number, username: string}
}
   */
  login: async (params: Request_Login, timeout_ = 5000) => {
    const url = 'http://' + import.meta.env.VITE_BACK_END_URL +'/api/auth/login';
    console.log("login url:",url);
    const response = await axios.post<Response_Login>(
      url, params,{
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: timeout_
    })
    return response
  },
  /**
   * 向后端发送注册请求，携带必要的注册信息
   * @param params Request_Register{username: string, password: string, phone : string | null, email : string | null}
   * @param timeout_ 超时时间
   * @returns 注册获得的用户uid和返回的确认用户名 Response_register{uid : string, username: string}
   */
  register: async (params: Request_Register, timeout_ = 5000) => {
    const response =  await axios.post<Response_register>(
      'http://' + import.meta.env.VITE_BACK_END_URL +'/api/auth/register', params,{
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: timeout_
    })
    return response
  }
  // /**
  //  * 向后端请求刷新token有效期
  //  *
  //  */
  // refresh: async (timeout_ = 5000) => {
  //   const response = await axios.get('http://' + import.meta.env.VITE_BACK_END_URL +'/auth/refresh')
  // }
}
