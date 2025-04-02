/**
 * 一条输入/输出
 */
interface Log{
  isSpeakerUser:  boolean,
  content:  string
}

/**
 * 一则对话历史记录
 */
interface LogsRecord{
  session_id : number,
  title : string
}

export type{Log, LogsRecord}
