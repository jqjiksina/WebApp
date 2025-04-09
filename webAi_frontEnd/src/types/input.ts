interface LogInputResponse{
  session_id : number //所在的session_id
  content: string  //ai回复的http文本，需要渲染
}
interface LogInputRequest{
  session_id : number //所在的session_id
  content: string  //ai回复的http文本，需要渲染
}

export type{LogInputResponse, LogInputRequest}
