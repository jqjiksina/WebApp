import { defineStore } from 'pinia'
import {ref, computed} from 'vue'
import type{LoginParams, RegistryParams} from '@/types/userApi'

// 第一个参数是应用程序中 store 的唯一 id
export const useUsersStore = defineStore('users', ()=>{
  const token = ref<string>('')
  const username = ref<string>('')
  const email = ref<string>('')
  const password = ref<string>('')

  const getToken = computed(()=>token);
  const getUser = computed(()=>{return {username,email,password}})

  function updateToken(newToken: string){
    token.value = newToken;
  }
  function isRegistryParams(obj: RegistryParams|LoginParams): obj is RegistryParams { //类型谓词
    return 'email' in obj && typeof obj.email == 'string';
  }
  function updateUser(newUser: RegistryParams|LoginParams){
    if (!isRegistryParams(newUser)){
      username.value = newUser.username;
      password.value = newUser.password;
      return
    }
    username.value = newUser.username;
    email.value = newUser.email;
    password.value = newUser.password;
  }

  return {getToken, getUser, updateToken, updateUser}
})
