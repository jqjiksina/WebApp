import axios from "axios";

export interface User{
  name: string,   //用户名
  avatar: string  //头像路径
}

/**
 * 提交给后端的登录表单格式
 */
export interface Request_Login {
  username: string
  password: string
}

/**
 * 提交给后端的注册表单
 */
export interface Request_Register extends Request_Login{
  phone : string | null
  email : string | null
}

/**
 * 登录请求的后端回应，包含token和用户信息
 */
export interface Response_Login {
  access_token: string
  token_type: string
  user_info: {
      user_id: number
      username: string
  }
}

/**
 * 注册请求的后端回应，包含uid和username
 */
export interface Response_register{ //不是很确定
  uid : string
  username: string
}

/**
 * 登录表单的格式，用于验证字段
 */
export interface Params_Login extends Request_Login{
  code: string  // 验证码
}

/**
 * 注册表单的格式，用于验证字段
 */
export interface Params_Register extends Request_Register {
  password_again: string
  code: string  // 验证码
}

export interface Params_User{
  username : string
  password : string
}

/**
 * 用户身份验证API，实现了登录、注册、检查token的API。
 */
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
  },
  /**
   * 向后端请求验证身份
   * @param timeout_ 超时时间
   * @returns 返回是否认证成功
   */
  check_auth: async (timeout_ = 5000) => {
    const response = await axios.get<boolean>(
      'http://' + import.meta.env.VITE_BACK_END_URL +'/api/auth/check',
      {
        headers: {
        'Content-Type': 'application/json'
      },
      timeout: timeout_})
    return response
  }
}
