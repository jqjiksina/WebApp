from typing import List, Literal, Optional

from pydantic import Field
from sqlalchemy import update
from database.core import get_async_db
from discord import HTTPException
from fastapi import APIRouter, Depends, HTTPException, status
from api.ragflow.schem import ChatAssistantConfig, Response_Chat
from dependencies.index import  get_current_user
from schema.chat import LogItem, Request_ChatLog, Response_GetChatLog, Response_PostChatLog, Response_ChatSession, SessionItem
from database.models import User

from api.ragflow.ragflow import rag_client
from config import Config
from sqlalchemy.ext.asyncio import AsyncSession

# assitant_id = Config.DEFAULT_ASSISTANT_ID # 测试用，正常应该根据用户得到专属助理


router = APIRouter(
    tags=["chatSession"])

def get_assistant_id(user : User =  Depends(get_current_user),
                    db : AsyncSession = Depends(get_async_db)
                    )->str:
    print("[Debug] get_assistant_id...")
    assistant_id = user.assistant_id
    if not assistant_id:
        assistant = ChatAssistantConfig(name=f"{user.name}_{user.external_id}_assistant")
        response = rag_client.createAssistant(assistant)
        db.execute(update(User).where(User.id==user.id).values(assistant_id=response["data"]["id"]))
        print("[Debug] get_assistant_id done(new):",response["data"]["id"])
        return response["data"]["id"]
    print("[Debug] get_assistant_id done:",assistant_id)
    return assistant_id

@router.get('/chatSession')
async def getChatSession(user : User =  Depends(get_current_user),
                         assistant_id : str = Depends(get_assistant_id)
                         )->Response_ChatSession:
    '''获取用户在对应群组的assitant所拥有的与自己相关的chatsession列表'''
    print("[Debug] getChatSession...")
    sessions = rag_client.getSessionList(assistant_id,user_id=user.external_id)
    sessions = sessions.data
    if not sessions:
        print("sessions empty")
        return Response_ChatSession(message="empty sessions")
    print("[Debug] chatSessions: ", sessions)
    new_list = [
        SessionItem(
            session_id = item.id,
            title = item.name
        ) for item in sessions
    ]
    return Response_ChatSession(session=new_list)

@router.get('/chatLog')
async def getChatLog(session_id : str, 
                     user: User = Depends(get_current_user),
                     assistant_id : str = Depends(get_assistant_id)
                     ):
    '''获取一个chatsession中的所有chatlog'''
    
    sessions = rag_client.getSessionList(assistant_id,user_id=user.external_id,session_id=session_id)
    sessions = sessions.data
    if not sessions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="session not found")
        
    log_list : List[LogItem] = []
    for session in sessions:
        for message in session.messages:
            item = LogItem(role = message.role,
                        content = message.content)
            log_list.append(item)
    
    print("[Debug] log_list:",str(log_list)[:100])
    if not log_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到对应对话记录！"
        )
    return Response_GetChatLog(logs = log_list)

@router.post('/chatLog')
async def postChatLog(request : Request_ChatLog,
                      user : User = Depends(get_current_user),
                      assistant_id : str = Depends(get_assistant_id)
                      ):
    '''    提交一次信息，发往ai接口进行处理后，加入信息到数据库    '''
    print("session_id:",request.session_id)
    response = rag_client.chat(assistant_id,
                               request.content,
                               request.session_id,
                               user.external_id)
    if (Response_Chat.is_error(response)):
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT,
                            detail="输入cotent为空")
    if not response.data :
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # response = handle_user_question(content,"4a3516d6111811f094600242ac130005")
    if Response_Chat.is_stream_end(response):
        return Response_PostChatLog()
    elif type(response.data) != Literal[True]:
        return Response_PostChatLog(
            session_id=response.data.session_id,
            content=response.data.answer
        )
    