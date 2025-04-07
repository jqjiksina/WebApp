from typing import List, Literal
from discord import HTTPException
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, insert, select, update
from sqlalchemy.orm import selectinload
from api.ragflow.schem import Response_Chat, Response_GetSessions
from dependencies.auth import check_group_member, get_current_user
from schema.chat import LogItem, Request_ChatLog, Response_GetChatLog, Response_PostChatLog, Response_ChatSession, SessionItem
from database.core import get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import BaseModel, User, Group, Rel_UserGroup
from schema.response import Response

from api.ragflow.ragflow import handle_user_question,rag_client



router = APIRouter(
    tags=["chatSession"])

@router.get('/chatSession')
async def getChatSession(user : User =  Depends(get_current_user),
                         group : Group = Depends(check_group_member)
                         )->Response_ChatSession:
    '''获取用户在对应群组的assitant所拥有的与自己相关的chatsession列表'''
    print("[Debug] getChatSession...")
    assitant_id = group.assistant_id
    sessions = rag_client.getSessionList(assitant_id,user_id=user.external_id)
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
                     group : Group = Depends(check_group_member)):
    '''获取一个chatsession中的所有chatlog'''
    
    assitant_id = group.assistant_id
    sessions = rag_client.getSessionList(assitant_id,user_id=user.external_id,session_id=session_id)
    sessions = sessions.data
    if not sessions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="session not found")
        
    log_list : List[LogItem] = []
    for session in sessions:
        for message in session.messages:
            item = LogItem(role = message.role,
                        content =  message.content)
            log_list.append(item)
    
    print("[Debug] log_list:",str(log_list)[:100])
    if not log_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到对应对话记录！"
        )
    return Response_GetChatLog(logs = log_list)

@router.post('/chatLog')
async def postChatLog(message : Request_ChatLog, 
                      user : User = Depends(get_current_user),
                      group : Group = Depends(check_group_member)):
    '''    提交一次信息，发往ai接口进行处理后，加入信息到数据库    '''
    assitant_id = group.assistant_id
    
    print("message.session_id:",message.session_id)
    response = rag_client.chat(assitant_id,
                               message.content,
                               message.session_id,
                               user.external_id)
    if (Response_Chat.is_error(response)):
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT,
                            detail="输入cotent为空")
    if not response.data :
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # response = handle_user_question(message.content,"4a3516d6111811f094600242ac130005")
    if Response_Chat.is_stream_end(response):
        return Response_PostChatLog()
    elif type(response.data) != Literal[True]:
        return Response_PostChatLog(
            session_id=response.data.session_id,
            content=response.data.answer
        )
    