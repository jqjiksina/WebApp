from turtle import st
from pydantic import BaseModel
from schema.response import Response

class Request_ChatLog(BaseModel):
    session_id: int
    content : str