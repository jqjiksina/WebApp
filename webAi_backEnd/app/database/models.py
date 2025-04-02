from collections import UserList
from datetime import datetime
from typing import List
from sqlalchemy import TEXT, Boolean, CheckConstraint, Column, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship,declarative_base,Mapped,mapped_column

'''
主要采用2NF设计
每个表采用自增独立id+外键的设计。
'''

# 声明基类
Base = declarative_base()

# 定义 User 类
class User(Base):
    __tablename__ = 'user'  # 定义表名
    
    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    username = Column(String(32))
    phone = Column(String(11), unique=True, index=True, nullable=True)
    email = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)   # 注册后自动登录，所以defalut=True
    created_time = Column(String(63), default = datetime.utcnow())
    
    have_sessions : Mapped[List["ChatSession"]] = relationship("ChatSession",back_populates="of_user",uselist=True,lazy="select") # 一对多
    
    __table_args__ = (
        CheckConstraint('phone is not null or email is not null' , name = '_ck_phone_emial'),
        {}
    )
    
class ChatSession(Base):
    __tablename__ = "chat_session"
    
    user_id : Mapped[int] = mapped_column(Integer, ForeignKey(User.id))
    id : Mapped[int] = mapped_column(Integer, primary_key=True,index=True,autoincrement=True)
    
    title : Mapped[str] = mapped_column(String(63))
    created_time = Column(String(63), default = datetime.utcnow())
    
    of_user : Mapped[User] = relationship("User",back_populates="have_sessions",uselist=False)   # 多对一
    have_logs = relationship("ChatLog", back_populates="of_session")
    
    Index('idx_userId_id',user_id,id)
    
    
class ChatLog(Base):
    __tablename__ = "chat_log"
    
    user_id = Column(Integer,ForeignKey(User.id))
    chatSession_id = Column(Integer,ForeignKey(ChatSession.id))
    id = Column(Integer,primary_key=True,index=True)
    
    content : Mapped[str] = mapped_column(TEXT)
    
    of_session : Mapped[ChatSession] = relationship("ChatSession",back_populates="have_logs",uselist=False)
    
    Index('idx_userId_chatSessionId_id',user_id,chatSession_id,id)
    
class Client(Base): # 客户端
    __tablename__ =  "client"
    
    id = Column(Integer, index= True, primary_key=True)
    
    secret = Column(String(255), unique= True)
    created_time =  Column(String(63), default = datetime.utcnow())