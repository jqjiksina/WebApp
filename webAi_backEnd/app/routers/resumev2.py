from typing import Literal
from sqlalchemy import update
from schema.chat import Request_ChatLog, Response_PostChatLog
from database.core import get_async_db
from fastapi import APIRouter, File, UploadFile, HTTPException,Depends, status
from fastapi.responses import JSONResponse, StreamingResponse
from pathlib import Path
import uuid
import shutil
from dependencies.index import get_current_user
from database.models import User
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import subprocess
import json
import time
from loguru import logger

from config import Config
from api.hiagent.hiagent import hiagent

router = APIRouter(
    prefix="/api/resume",
    tags=["resume"])

class Request_ListSession(BaseModel):
    session_id : str | None
    
class Request_DeleteSession(BaseModel):
    session_ids : list[str]
    
class Request_Upload(BaseModel):
    resumeContent: str

# 创建用户和用户简历文本之间的映射
resume_map = {}

@router.post("/upload")
async def upload_resume(request: Request_Upload,
                        user:User = Depends(get_current_user)):
    '''
    接受前端上传的简历文本（不存储在磁盘），每次在相应用户对话时，若存在对应简历文件，则附上。
    '''
    logger.debug("[Debug] upload resume...")
    
    resume_map.update({user.external_id:request.resumeContent})
    
    logger.debug(f"[Debug] upload finished:{request.resumeContent}")
    

    
@router.post("/chat")
async def chat_resume(request : Request_ChatLog,
                      user : User = Depends(get_current_user)):
    '''
    先根据当前模式（简历模式和特定用户）得到相应的助理id
    如果第一次开始对话，那么创建会话
    否则直接在指定session_id上继续对话
    '''
    logger.debug(f"[Debug] chat_resume on session_id:{request.session_id}")
    
    content = request.content
    if resume_map.get(user.external_id):
        content += f"\r\n\r\n **简历内容为**：{resume_map[user.external_id]}"
        logger.debug("content:",content)
    
    # 如果没有session_id，创建一个新的会话
    if not request.session_id:
        # 创建新会话
        session_response = await hiagent.createSession(user.external_id)
        if session_response and session_response["Conversation"]:
            request.session_id = session_response["Conversation"]["AppConversationID"]
    
    # 设置流式传输
    response = hiagent.chat(request.session_id,user.external_id,content)
    async def generate():
        async for chunk in response:
            yield f"data: {chunk}\n\n"
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
        
@router.get("/newSession")
async def new_session(user : User = Depends(get_current_user)):
    '''创建新的会话'''
    session_response = await hiagent.createSession(user.external_id)
    if session_response and session_response["Conversation"]:
        return {"session_id" : session_response["Conversation"]["AppConversationID"]}
        
@router.post("/delete_session")
async def delete_session(request : Request_DeleteSession,user: User = Depends(get_current_user)):
    logger.debug(f"[Debug] delete_session begin:{request.session_ids}")
    for session_id in request.session_ids:
        await hiagent.deleteSession(session_id, user.external_id)
    return
    
@router.post("/list_session")
async def list_session(request: Request_ListSession, user: User = Depends(get_current_user)):
    sessions = []
    if not request.session_id:  # get all the sessions of the user
        response = await hiagent.getSessionList(user.external_id)
        for session in response["ConversationList"]:
            session_id = session["AppConversationID"]
            message_response = await hiagent.getMessageHistory(session_id,user.external_id)
            messages = []
            for message in message_response["Messages"]:    # 和前端ChatHistoryManager会话管理类型保持一致
                messages.append({"role" : "user",
                                 "content" : message["Query"]})
                messages.append({"role" : "assistant",
                                 "content" : message["AnswerInfo"]["Answer"]})
            sessions.append({
                "id" : session_id,
                "title" : session["ConversationName"],
                "messages" : messages,
                "update_time" : session["LastChatTime"],
                "create_time" : session["CreateTime"]
            })
    else:                       # get selected sessionId's history of the user
        message_response = await hiagent.getMessageHistory(request.session_id,user.external_id)
        messages = []
        for message in message_response["Messages"]:    # 和前端ChatHistoryManager会话管理类型保持一致
            messages.append({"role" : "user",
                                "content" : message["Query"]})
            messages.append({"role" : "assistant",
                                "content" : message["AnswerInfo"]["Answer"]})
        sessions.append({
            "id" : session_id,
            "title" : session["ConversationName"],
            "messages" : messages,
            "update_time" : session["LastChatTime"],
            "create_time" : session["CreateTime"]
        })

    return sessions