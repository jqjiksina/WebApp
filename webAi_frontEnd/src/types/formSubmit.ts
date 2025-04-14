/**
 * 提交给后端的登录表单格式
 */
interface Request_Login {
  username: string
  password: string
}

/**
 * 提交给后端的注册表单
 */
interface Request_Register extends Request_Login{
  phone : string | null
  email : string | null
}

/**
 * 登录请求的后端回应，包含token和用户信息
 */
interface Response_Login {
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
interface Response_register{ //不是很确定
  uid : string
  username: string
}

/**
 * 登录表单的格式，用于验证字段
 */
interface Params_Login extends Request_Login{
  code: string  // 验证码
}

/**
 * 注册表单的格式，用于验证字段
 */
interface Params_Register extends Request_Register {
  password_again: string
  code: string  // 验证码
}

interface Params_User{
  username : string
  password : string
}

export type {Params_Login,Response_Login,Params_Register,Response_register,Request_Login,Request_Register,Params_User}
