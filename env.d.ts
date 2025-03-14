/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_BACK_END_HOST:string;//定义提示信息 数据是只读的无法被修改
  readonly APP_BACK_END_PORT:string;
  readonly APP_BACK_END_URL :string;
  //多个变量定义多个...
}
