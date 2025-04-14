import { defineStore } from 'pinia'
import {ref, computed} from 'vue'
import type{Params_Login, Params_Register, Params_User} from '@/types/formSubmit'

// 第一个参数是应用程序中 store 的唯一 id
export const useUsersStore = defineStore('users', ()=>{
  const uid = ref<string>('')
  const phone = ref<string | null>('')
  const username = ref<string>('')
  const email = ref<string | null>('')
  const password = ref<string>('')
  const token = ref<string>('')

  const getToken = computed(()=>token.value);
  const getUser = computed(()=>{
    return {username,phone,email,password}
  });
  const getUid = computed(()=>uid.value)

  function clearToken(){
    token.value = ""
  }
  function updateToken(newToken: string){
    token.value = newToken;
  }
  /**
   * 向后端提交表单时，刷新缓存用户信息，以方便自动刷新token
   * @param newUser 登录表单中所填写的信息
   */
  function updateUser(newUser: Params_User){
    console.log("更新UserStore:",newUser)
      username.value = newUser.username;
      password.value = newUser.password;
      console.log("更新后：","username:",username.value,"password",password.value)
      return
  }

  return {getToken, getUser, updateToken, getUid, updateUser, clearToken,phone,email,password,username}
},{
  persist:true
})
