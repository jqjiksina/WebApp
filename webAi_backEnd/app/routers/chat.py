from discord import HTTPException
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import and_, insert, select, update
from sqlalchemy.orm import selectinload
from schema.response import Response
from dependencies.auth import get_current_user
from schema.chat import LogItem, Request_ChatLog, Response_GetChatLog, Response_PostChatLog, Response_ChatSession, SessionItem
from database.core import get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Base, ChatLog, User,ChatSession
from schema.response import Response


router = APIRouter(
    tags=["chatSession"])

@router.get('/chatSession')
async def getChatSession(user : User =  Depends(get_current_user), 
                         db : AsyncSession = Depends(get_async_db)
                         ):
    '''获取用户的chatsession列表'''
    _user = await db.execute(select(User).where(User.id == user.id).options(selectinload(User.have_sessions)))
    _user = _user.scalars().first()
    print("_user:",_user)
    if not _user:
        return HTTPException(status_code=404, detail="User not found")
    sessions = _user.have_sessions
    if not sessions:
        return []
    print("chatSessions: ", sessions)
    new_list = [
        SessionItem(
            session_id = item.id,
            title = item.title
        ) for item in sessions
    ]
    return Response_ChatSession(session=new_list)

@router.get('/chatLog')
async def getChatLog(session_id : int, 
                     user: User = Depends(get_current_user), 
                     db : AsyncSession = Depends(get_async_db)):
    '''获取一个chatsession中的所有chatlog'''
    logs = await db.execute(select(ChatLog).
                            where(and_(ChatLog.user_id == user.id,
                                       ChatLog.chatSession_id == session_id)).
                            order_by(ChatLog.id))
    logs = logs.scalars()
    log_list = [LogItem(
            isSpeakerUser= True,
            content = item.content
        ) for item in logs]
    print("log_list:",log_list)
    if not logs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到对应对话记录！"
        )
    return Response_GetChatLog(logs = log_list)

@router.post('/chatLog')
async def postChatLog(message : Request_ChatLog, 
                      user : User = Depends(get_current_user),
                      db : AsyncSession = Depends(get_async_db)):
    '''    提交一次信息，发往ai接口进行处理后，加入信息到数据库    '''
    print("message.session_id:",message.session_id)
    # 先查询user是否持有该mesasge的session_id，若有，则开始执行。
    session = await db.execute(select(ChatSession).
                               where(and_(ChatSession.user_id == user.id,
                                          ChatSession.id == message.session_id)))
    session = session.scalar()
    if not session :# 开启一个新会话
        print("session not found")
        session = ChatSession(user_id = user.id, title = 'temporary')
        db.add(session)
        await db.flush()
        print("session add:",session.id)
        
    chatlog = ChatLog(user_id = user.id, chatSession_id = session.id, content = message.content)
    print ("to be inserted chatlog:id:",chatlog.id,
           "session_id:",chatlog.chatSession_id,
           "user_id:",chatlog.user_id,
           "content:",chatlog.content)
    db.add(chatlog)
    await db.commit()
    
    result = (await db.execute(select(ChatSession).where(ChatSession.id == session.id))).scalars().first()
    if not result:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    # 发给ai处理
    return Response_PostChatLog(
        session_id=result.id,
        content="test_reply"
    )
    