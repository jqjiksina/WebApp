interface Log{          //一条输入/输出
  isSpeakerUser:  boolean,
  content:  string
}

interface LogsRecord{   //一则对话历史记录
  url : string
  title: string,
}

export type{Log, LogsRecord}
