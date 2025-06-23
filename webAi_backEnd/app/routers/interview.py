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
        # 创建新会话
        session_response = await rag_client.createSession(Config.INTERVIEW_AGENT_ID, "Ai面试会话", user.external_id)
        if session_response and session_response.get("data"):
            request.session_id = session_response["data"]["id"]
            
    response = rag_client.chat(Config.INTERVIEW_AGENT_ID, request.answer, request.session_id, user.external_id, True, True)
    
    msg = "" # 流式响应收到的总消息
    # lastpos = 0
    session_id = request.session_id  # 初始化为请求中的 session_id
        
    # async for chunk in response:
    #     chunk_data = json.loads(chunk)
    #     if chunk_data["type"] == "text":
    #         msg = chunk_data["content"]
    #         result = msg[lastpos:]
    #         interupt = lastpos == 0
    #         if len(msg) - lastpos >= 40 : # 以40个字符为单位，发送给数字人说话
    #             await digital_human.play(result, human_session_id, interupt)
    #             lastpos = len(msg)
    #         # 更新 session_id，确保使用最新的值
    #         if "session_id" in chunk_data:
    #             session_id = chunk_data["session_id"]
    #     elif chunk_data["type"] == "end" and lastpos != len(msg):
    #         await digital_human.play(result, human_session_id, interupt)
    
    # 不使用流式地传输，去掉think部分
    async for chunk in response:
        chunk_data = json.loads(chunk)
        if chunk_data["type"] == "text":
            msg = chunk_data["content"]
            # 更新 session_id，确保使用最新的值
            if "session_id" in chunk_data:
                session_id = chunk_data["session_id"]
        elif chunk_data["type"] == "end": # 开始处理think标签的内容，去掉思考过程后再发送
            msg = msg.split("</think>")
            logger.debug(f"msg:{msg}")
            # try:
            #     await digital_human.play(msg[-1], human_session_id, user,True)
            # except:
            #     return {"status":404,"statusText":"数字人调用失败，请检查数字人是否连接！","data":{"session_id":session_id}}
    
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
    logger.debug(f"delete_session begin:{request.session_id}")
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
    
    
    