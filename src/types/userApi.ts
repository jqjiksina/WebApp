interface LoginParams {
  username: string
  password: string
}

interface LoginResponse {
  token: string
}

interface RegistryParams {
  username: string
  email: string
  password: string
}

export type {LoginParams,LoginResponse,RegistryParams}
