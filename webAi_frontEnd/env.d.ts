/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACK_END_HOST:string;//定义提示信息 数据是只读的无法被修改
  readonly VITE_BACK_END_PORT:string;
  readonly VITE_BACK_END_URL :string;
  //多个变量定义多个...
}
