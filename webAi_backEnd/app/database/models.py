from collections import UserList
from datetime import datetime
from sqlalchemy import TEXT, Boolean, CheckConstraint, Column, ForeignKey, Index, Integer, PrimaryKeyConstraint, String, UniqueConstraint
from sqlalchemy.orm import relationship,declarative_base

### 采用 2NF 来设计DB

# 声明基类
Base = declarative_base()

# 定义 User 类
class User(Base):
    __tablename__ = 'user'  # 定义表名
    
    id = Column(Integer, primary_key=True, index=True)
    
    username = Column(String(32))
    phone = Column(String(11), unique=True, index=True, nullable=True)
    email = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)   # 注册后自动登录，所以defalut=True
    created_time = Column(String(63), default = datetime.utcnow())
    
    have_sessions = relationship("ChatSession",back_populates="of_user") # 一对多
    
    __table_args__ = (
        CheckConstraint('phone is not null or email is not null' , name = '_ck_phone_emial'),
        {}
    )
    
class ChatSession(Base):
    __tablename__ = "chat_session"
    
    user_id = Column(Integer, ForeignKey(User.id))
    id = Column(Integer, primary_key=True) # 当前user的第几个session
    
    title = Column(String(63))
    created_time = Column(String(63), default = datetime.utcnow())
    
    of_user = relationship("User",back_populates="have_sessions",uselist=False)   # 多对一
    have_logs = relationship("ChatLog", back_populates="of_session")
    
    Index('idx_userId_id',user_id,id)
    
    
class ChatLog(Base):
    __tablename__ = "chat_log"
    
    user_id = Column(Integer, ForeignKey(User.id))
    chatSession_id = Column(Integer, ForeignKey(ChatSession.id))
    id = Column(Integer) # 当前Session的第几条消息
    
    content = Column(TEXT)
    
    of_session = relationship("ChatSession",back_populates="have_logs",uselist=False)
    
    Index('idx_userId_chatSessionId_id',user_id,chatSession_id,id)
    __table_args__ = (
        PrimaryKeyConstraint('user_id','chatSession_id','id'),
        {}
    )
    
class Client(Base): # 客户端
    __tablename__ =  "client"
    
    id = Column(Integer, index= True, primary_key=True)
    
    secret = Column(String(255), unique= True)
    created_time =  Column(String(63), default = datetime.utcnow())
    
class Pool(Base): # id分配池
    __tablename__ = "pool"
    
    table_name = Column(String(127),primary_key=True)
    max_id = Column(Integer, default=0)