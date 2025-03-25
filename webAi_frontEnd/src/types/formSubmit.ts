interface LoginPost { //提交给后端的登录表单
  phone: string
  password: string
}

interface RegistryPost extends LoginPost{ //提交给后端的注册表单
  username: string
  email ?: string
}
interface LoginParams extends LoginPost{
  code: string  // 验证码
}
interface RegistryParams extends RegistryPost {
  password_again: string
  code: string  // 验证码
}

interface LoginResponse {   //需要进一步学习格式
  uid : string
  username: string
  token: string
}

interface registerResponse{ //不是很确定
  uid : string
  username: string
}


export type {LoginParams,LoginResponse,RegistryParams,registerResponse,LoginPost,RegistryPost}
