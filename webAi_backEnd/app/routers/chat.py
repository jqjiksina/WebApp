from discord import HTTPException
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, insert, select, update
from schema.response import Response
from dependencies.auth import get_current_user
from schema.chat import Request_ChatLog
from database.core import get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import ChatLog, Pool, User,ChatSession
from schema.response import Response


router = APIRouter(
    tags=["chatSession"])

@router.get('/chatSession')
async def getChatSession(user : User =  Depends(get_current_user), 
                         db : AsyncSession = Depends(get_async_db)):
    '''获取用户的chatsession列表'''
    sessions = await db.execute(select(User.have_sessions).where(User.id == user.id))
    print("chatSessions: ", sessions)
    return sessions

@router.get('/chatLog')
async def getChatLog(session_id : int, 
                     user: User = Depends(get_current_user), 
                     db : AsyncSession = Depends(get_async_db)):
    '''获取一个chatsession中的所有chatlog'''
    logs = await db.execute(select(ChatLog.content).
                            where(and_(ChatLog.user_id == user.id,
                                       ChatLog.chatSession_id == session_id)).
                            order_by(ChatSession.id))
    if not logs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到对应对话记录！"
        )
    return logs

@router.post('/chatLog')
async def postChatLog(message : Request_ChatLog, 
                      user : User = Depends(get_current_user),
                      db : AsyncSession = Depends(get_async_db)):
    '''    提交一次信息，发往ai接口进行处理后，加入信息到数据库    '''
    # 先查询user是否持有该mesasge的session_id，若有，则开始执行。
    session = await db.execute(select(ChatSession).
                               where(and_(ChatSession.user_id == user.id,
                                          ChatSession.id == message.session_id)))
    if not session.scalars().first(): # 开启一个新会话
        pool = await db.execute(select(Pool).
                   where(Pool.table_name == ChatSession.__tablename__))
        to_be_insert_id = -1
        if not pool.scalars().first(): # 插入一个新的池子
            await db.execute(insert(Pool).
                             values(table_name = ChatSession.__tablename__,
                                    max_id = 1))
            to_be_insert_id = 0
            
        if (to_be_insert_id == -1):
            to_be_insert_id = pool.scalars().first().max_id
            await db.execute(update(Pool).
                             where(Pool.table_name == ChatSession.__tablename__).
                             values(max_id = to_be_insert_id))
            
        await db.execute(insert(ChatSession).
                         values(user_id = user.id,
                                id = to_be_insert_id,
                                title = "generated title",
                                ))
        
        to_be_insert_id_1 = -1
        if not pool.scalars().first(): # 插入一个新的池子
            await db.execute(insert(Pool).
                             values(table_name = ChatLog.__tablename__,
                                    max_id = 1))
            to_be_insert_id = 0
            
        if (to_be_insert_id_1 == -1):
            to_be_insert_id_1 = pool.scalars().first().max_id
            await db.execute(update(Pool).
                             where(Pool.table_name == ChatLog.__tablename__).
                             values(max_id = to_be_insert_id_1))
            
        await db.execute(insert(ChatLog).
                         values(user_id = user.id,
                                chatSession_id = to_be_insert_id,
                                id = to_be_insert_id_1,
                                text = Request_ChatLog.content
                                ))
        
        await db.commit()
        return Response(message="suceed posting messages!")