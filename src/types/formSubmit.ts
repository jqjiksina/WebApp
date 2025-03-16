interface LoginParams {
  username: string
  password: string
}

interface LoginResponse {   //需要进一步学习格式
  uid : string
  token: string
}

interface registerResponse{ //不是很确定
  uid : string
}

interface RegistryParams {
  username: string
  email: string
  password: string
}

export type {LoginParams,LoginResponse,RegistryParams,registerResponse}
