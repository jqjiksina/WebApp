from typing import Literal
from sqlalchemy import update
from api.ragflow.schem import Response_Chat
from schema.chat import Request_ChatLog, Response_PostChatLog
from database.core import get_async_db
from fastapi import APIRouter, File, UploadFile, HTTPException,Depends, status
from fastapi.responses import JSONResponse, StreamingResponse
from pathlib import Path
import uuid
import shutil
from api.ragflow.ragflow import rag_client
from dependencies.index import get_current_user
from database.models import User
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import subprocess
import json
import time

from config import Config

router = APIRouter(
    tags=["resume"])

class Request_ListSession(BaseModel):
    session_id : str | None
    
class Request_DeleteSession(BaseModel):
    session_ids : list[str]
    
class Request_Upload(BaseModel):
    resumeContent: str

# 创建用户和用户简历文本之间的映射
resume_map = {}

@router.post("/api/resume/upload")
async def upload_resume(request: Request_Upload,
                        user:User = Depends(get_current_user),
                        db:AsyncSession = Depends(get_async_db)):
    '''
    接受前端上传的简历文本（不存储在磁盘），每次在相应用户对话时，若存在对应简历文件，则附上。
    '''
    print("[Debug] upload resume...")
    
    resume_map.update({user.external_id:request.resumeContent})
    
    print("[Debug] upload finished:",request.resumeContent)
    

    
@router.post("/api/resume/chat")
async def chat_resume(request : Request_ChatLog,
                      user : User = Depends(get_current_user)):
    '''
    先根据当前模式（简历模式和特定用户）得到相应的助理id
    如果第一次开始对话，那么创建会话
    否则直接在指定session_id上继续对话
    '''
    
    assistant_id = user.assistant_id
    print("[Debug] chat_resume on session_id:",request.session_id)
    
    content = request.content
    if resume_map.get(user.external_id):
        content += f"\r\n\r\n **简历内容为**：{resume_map[user.external_id]}"
        print("content:",content)
    
    try:
        # 如果没有session_id，创建一个新的会话
        if not request.session_id:
            # 创建新会话
            session_response = await rag_client.createSession(assistant_id, "简历分析会话", user.external_id)
            if session_response and session_response.get("data"):
                request.session_id = session_response["data"]["id"]
        
        # 设置流式传输
        response = rag_client.chat(assistant_id,
                                 content,
                                 request.session_id,
                                 user.external_id,
                                 stream=True)
        stream = True
        # 对于流式响应，直接返回生成器
        if stream:
            async def generate():
                async for chunk in response:
                    # print("one stream:",chunk)
                    yield f"data: {chunk}\n\n"
            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        
        # 非流式响应的处理
        if Response_Chat.is_error(response):
            raise HTTPException(status_code=status.HTTP_204_NO_CONTENT,
                              detail="输入content为空")
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response_PostChatLog(
            session_id=response.data.session_id,
            content=response.data.answer
        )
    except Exception as e:
        print(f"[Error] chat_resume error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
        
@router.get("/api/resume/newSession")
async def new_session(user : User = Depends(get_current_user)):
    '''创建新的会话'''
    assistant_id = user.assistant_id
    session_response = await rag_client.createSession(assistant_id, "简历分析会话", user.external_id)
    if session_response and session_response["data"]:
        return {"session_id" : session_response["data"]["id"]}
        
@router.post("/api/resume/delete_session")
async def delete_session(request : Request_DeleteSession,user: User = Depends(get_current_user)):
    print("[Debug] delete_session begin:",request.session_ids)
    response = await rag_client.deleteSession(Config.DDEFAULT_AGENT_ID,request.session_ids)
    if (response.get("code")==0):
        return
    else:
        raise HTTPException(status_code=404,detail=response["message"])
    
@router.post("/api/resume/list_session")
async def list_session(request: Request_ListSession, user: User = Depends(get_current_user)):
    if not request.session_id:  # get all the sessions of the user
        response = await rag_client.getSessionList(Config.DEFAULT_ASSISTANT_ID,user_id=user.external_id)
    else:                       # get selected sessionId's history of the user
        response = await rag_client.getSessionList(Config.DEFAULT_ASSISTANT_ID,user_id=user.external_id,session_id=request.session_id)
    if response.get("code") == "102":
        raise HTTPException(status_code=102,detail=response["message"])
    # print("[Debug] list_session response:",response["data"])
    return [{"id": session["id"],
            "title" : session["name"],
            "messages":[message for message in session["messages"]],
            "update_time":session["update_time"],
            "create_time":session["create_time"],
            } for session in response["data"]]

