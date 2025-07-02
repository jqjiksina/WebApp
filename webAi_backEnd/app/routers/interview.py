import json
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import os
import time
from dependencies.index import get_current_user
from database.models import User
from database.core import get_async_db, AsyncSession
# from api.digital_human.index import digital_human
from api.ragflow.ragflow import rag_client
from config import Config
from loguru import logger

router = APIRouter(
    prefix="/api/interview",
    tags=["interview"]
)

class AnswerRequest(BaseModel):
    answer: str
    session_id: Optional[str] = None

class SetHumanSessionIdRequest(BaseModel):
    session_id: int
    
class ListSessionRequest(BaseModel):
    session_id : str | None
    
class DeleteSessionRequest(BaseModel):
    session_ids : list[str]

def get_digital_human_session(current_user: User = Depends(get_current_user)) -> int:
    '''根据用户的id获取数字人会话id'''
    if (not current_user.digital_human_session_id):
        raise HTTPException(status_code=400, detail="用户未连接到数字人")
    return current_user.digital_human_session_id

@router.post("/answer")
async def answer(request: AnswerRequest, user: User = Depends(get_current_user), human_session_id: int = Depends(get_digital_human_session)):
    '''根据用户的提问从ragflow获取去掉think标签内容的回复，后续由前端与数字人服务交互完成问答'''
    # 先将用户的回复发送到ragflow接口，然后流式地将返回的回复发送到数字人播报
    if (not request.session_id):
        # 仅创建新会话，触发开场白
        session_response = await rag_client.createSession(Config.INTERVIEW_AGENT_ID, "Ai面试会话", user.external_id,True)
        logger.debug(f"create response:{session_response}")
        if session_response and session_response.get("data"):
            request.session_id = session_response["data"]["id"]
            return {"session_id":session_response["data"]["id"],"message":session_response["data"]["message"][0]["content"],"human_session_id":human_session_id}
            
    response = rag_client.chat(Config.INTERVIEW_AGENT_ID, request.answer, request.session_id,False, True)

    async for chunk in response:
        msg = chunk["data"]["answer"].split("</think>")
        session_id = chunk["data"]["session_id"]
    
    return {"session_id":session_id,"message":msg[-1],"human_session_id":human_session_id}

@router.post("/set_human_session_id")
async def set_human_session_id(request: SetHumanSessionIdRequest, current_user: User = Depends(get_current_user), db : AsyncSession = Depends(get_async_db)):
    '''设置用户所连接的数字人会话id'''
    logger.debug(f"start set_human_session_id:{request.session_id}")
    from sqlalchemy import update
    await db.execute(update(User).where(User.id == current_user.id).values(digital_human_session_id = request.session_id))
    await db.commit()
    return

@router.post("/delete_session")
async def delete_session(request : DeleteSessionRequest,user: User = Depends(get_current_user)):
    logger.debug(f"delete_session begin:{request.session_ids}")
    response = await rag_client.deleteSession(Config.INTERVIEW_AGENT_ID,request.session_ids,True)
    if (response.get("code")==0):
        return
    else:
        raise HTTPException(status_code=404,detail=response["message"])
    
@router.post("/list_session")
async def list_session(request: ListSessionRequest, user: User = Depends(get_current_user)):
    if not request.session_id:  # get all the sessions of the user
        response = await rag_client.getSessionList(Config.INTERVIEW_AGENT_ID,user_id=user.external_id,is_agent=True)
    else:                       # get selected sessionId's history of the user
        response = await rag_client.getSessionList(Config.INTERVIEW_AGENT_ID,user_id=user.external_id,session_id=request.session_id,is_agent=True)
    if response.get("code") == "102":
        raise HTTPException(status_code=102,detail=response["message"])
    # logger.debug("list_session response:",response["data"])
    return [{"id": session["id"],
            "title" : "面试会话",
            "messages":[message for message in session["messages"]],
            "update_time":session["update_time"],
            "create_time":session["create_time"],
            } for session in response["data"]]
    
    
    