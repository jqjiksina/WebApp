import json
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
import os
import time
from dependencies.index import get_current_user
from database.models import User
from database.core import get_async_db, AsyncSession
from api.digital_human.index import digital_human
from api.ragflow.ragflow import rag_client
from config import Config

router = APIRouter(
    prefix="/api/interview",
    tags=["interview"]
)

class AnswerRequest(BaseModel):
    answer: str
    session_id: Optional[str] = None

class SetHumanSessionIdRequest(BaseModel):
    session_id: int

def get_digital_human_session(current_user: User = Depends(get_current_user)) -> int:
    '''根据用户的id获取数字人会话id'''
    if (not current_user.digital_human_session_id):
        raise HTTPException(status_code=400, detail="用户未连接到数字人")
    return current_user.digital_human_session_id

@router.post("/answer")
async def answer(request: AnswerRequest, user: User = Depends(get_current_user), human_session_id: int = Depends(get_digital_human_session)):
    '''将用户的回复发送到用户连接到的数字人'''
    # 先将用户的回复发送到ragflow接口，然后流式地将返回的回复发送到数字人播报
    
    if (not request.session_id):
        # 创建新会话
        session_response = await rag_client.createSession(Config.DDEFAULT_AGENT_ID, "Ai面试会话", user.external_id)
        if session_response and session_response.get("data"):
            request.session_id = session_response["data"]["id"]
            
    response = rag_client.chat(Config.DDEFAULT_AGENT_ID, request.answer, request.session_id, user.external_id, True, True)
    
    msg = "" # 流式响应收到的总消息
    lastpos = 0
    session_id = ""
        
    async for chunk in response:
        chunk_data = json.loads(chunk)
        if chunk_data["type"] == "text":
            msg = chunk_data["content"]
            result = msg[lastpos:]
            interupt = lastpos == 0
            await digital_human.play(result, human_session_id, interupt)
            lastpos = len(msg)
            if (not request.session_id):
                session_id = chunk_data.get("session_id")

    
    return {"code":200,"message":"success", "data":{"session_id":session_id}}

@router.post("/set_human_session_id")
async def set_human_session_id(request: SetHumanSessionIdRequest, current_user: User = Depends(get_current_user), db : AsyncSession = Depends(get_async_db)):
    '''设置用户所连接的数字人会话id'''
    print("[Debug] start set_human_session_id:",request.session_id)
    from sqlalchemy import update
    await db.execute(update(User).where(User.id == current_user.id).values(digital_human_session_id = request.session_id))
    await db.commit()
    return {"code":200,"message":"success"}

