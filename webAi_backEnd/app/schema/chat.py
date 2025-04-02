from pydantic import BaseModel
from sqlalchemy import Column, Integer

class Request_ChatLog(BaseModel):
    session_id: int
    content : str
    
class Response_PostChatLog(BaseModel):
    session_id : int
    content : str
    
class SessionItem(BaseModel):
    session_id: int
    title: str
class Response_ChatSession(BaseModel):
    session: list[SessionItem]
    
class LogItem(BaseModel):
    isSpeakerUser: bool
    content : str
class Response_GetChatLog(BaseModel):
    logs : list[LogItem]