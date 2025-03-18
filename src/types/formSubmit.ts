interface LoginParams {
  phone: string
  password: string
}

interface RegistryParams {
  phone: string
  username: string
  email: string
  password: string
  password_again: string
  validation_code: string
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


export type {LoginParams,LoginResponse,RegistryParams,registerResponse}
