from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer
from traitlets import default

class Request_ChatLog(BaseModel):
    session_id: Optional[str] = Field(default=None)
    content : str = Field(default=...)
    
class Response_PostChatLog(BaseModel):
    session_id : Optional[str] = Field(default=None)
    content : Optional[str] = Field(default=None)
    
class SessionItem(BaseModel):
    session_id: str
    title: str
class Response_ChatSession(BaseModel):
    message : str = Field(default="")
    session: List[SessionItem] = Field(default=[])
    
class LogItem(BaseModel):
    role: Literal["system","assistant","user"] = Field(default=...)
    content : str
class Response_GetChatLog(BaseModel):
    logs : list[LogItem]