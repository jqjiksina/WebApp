import type {User} from "@/types/user"

interface Log{
  arrater:  User,
  content:  string
}

interface LogsRecord{
  title: string,
  url : string
}

export type{Log, LogsRecord}
