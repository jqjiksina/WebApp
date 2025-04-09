from datetime import datetime
import enum
from typing import Generic, List,TypeVar
import uuid
from click import group
from numpy import real_if_close
from sqlalchemy import TIMESTAMP, Boolean, CheckConstraint, ForeignKey, Integer, PrimaryKeyConstraint, String, Enum, text
from sqlalchemy.orm import relationship,declarative_base,Mapped,mapped_column

'''
主要采用2NF设计
每个表采用自增独立id+外键的设计。
'''

# 声明基类
BaseModel = declarative_base()

# 定义 Group 类
class Group(BaseModel):
    '''群组表，存储群组及与其绑定的assitant id，每个Group有且只有一个assitant'''
    __tablename__ = "group"
    
    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    name : Mapped[int] = mapped_column(String(63),primary_key=True, unique=True)
    creator_id : Mapped[str] = mapped_column(String(63), nullable=True)
    created_time : Mapped[str] = mapped_column(TIMESTAMP, nullable=False, 
                                               server_default=text("CURRENT_TIMESTAMP"))
    updated_time : Mapped[str] = mapped_column(TIMESTAMP, nullable=False, 
                                               server_default=text("CURRENT_TIMESTAMP"),
                                               onupdate=text("CURRENT_TIMESTAMP"))
    assistant_id : Mapped[str] = mapped_column(String(63))
    
    have_users : Mapped[List["User"]] = relationship("User",secondary="rel_user_group",back_populates="of_groups",uselist=True)

# 定义 User 类
class User(BaseModel):
    '''用户表，存储用户信息，包括手机号密码邮箱等，用于身份验证'''
    __tablename__ = 'user'  # 定义表名
    
    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    external_id : Mapped[str] = mapped_column(String(63),unique=True, index=True, default=str(uuid.uuid4())  # "f47ac10b-58cc-4372-a567-0e02b2c3d479"
)
    
    name : Mapped[str] = mapped_column(String(32))
    phone : Mapped[str] = mapped_column(String(11), unique=True, index=True, nullable=True)
    email : Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=True)
    hashed_password : Mapped[str] = mapped_column(String(255))
    is_active : Mapped[bool] = mapped_column(Boolean, default=False)
    created_time : Mapped[str] = mapped_column(TIMESTAMP,nullable=False,
                                               server_default=text("CURRENT_TIMESTAMP"))
    updated_time : Mapped[str] = mapped_column(TIMESTAMP, nullable=False, 
                                               server_default=text("CURRENT_TIMESTAMP"),
                                               onupdate=text("CURRENT_TIMESTAMP"))
    assitant_ids : Mapped[List[str]] = mapped_column(String(63),nullable=True)
    
    # current_group : Mapped[Group] = relationship(Group,back_populates="have_users",uselist=False)
    of_groups : Mapped[List[Group]] = relationship(Group,secondary="rel_user_group",back_populates="have_users",uselist=True)
    # have_sessions : Mapped[List["ChatSession"]] = relationship("ChatSession",back_populates="of_user",uselist=True,lazy="select") # 一对多
    
    __table_args__ = (
        CheckConstraint('phone is not null or email is not null' , name = 'ck_phone_emial'),
        {}
    )
    
class Enum_Role(enum.Enum):
    admin = "admin"
    member = "member"
    
class Rel_UserGroup(BaseModel):
    '''User和所属的Group的关系'''
    __tablename__ = 'rel_user_group'
    user_id : Mapped[int] = mapped_column(Integer,ForeignKey(User.id))
    group_id : Mapped[int] = mapped_column(Integer,ForeignKey(Group.id))
    role : Mapped[str] = mapped_column(Enum(Enum_Role),
                                       default=Enum_Role.member)
    joined_time : Mapped[str] = mapped_column(TIMESTAMP, nullable=False,
                                              server_default=text("CURRENT_TIMESTAMP"))
    
    __table_args__ = (
        PrimaryKeyConstraint(user_id,group_id,name="pk_user_group"),
        {}
    )
    
class Enum_Request(enum.Enum):
    '''群组申请状态枚举'''
    approved = "approved"
    rejected = "rejected"
    pending = "pending"
    
class JoinGroupRecord(BaseModel):
    '''加入群组申请记录表'''
    __tablename__ = 'join_group_record'
    user_id : Mapped[int] = mapped_column(Integer, ForeignKey(User.id))
    group_id : Mapped[int] = mapped_column(Integer,ForeignKey(Group.id))
    
    status : Mapped[str] = mapped_column(Enum(Enum_Request))
    added_time : Mapped[str] = mapped_column(TIMESTAMP, nullable=False, 
                                             server_default=text('CURRENT_TIMESTAMP'))
    processed_time : Mapped[str] = mapped_column(TIMESTAMP,nullable=True, 
                                                 server_default=None,
                                                 onupdate=text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        PrimaryKeyConstraint(user_id,group_id,name="pk_join_group_record"),
        {}
    )
    
    
# class ChatSession(Base):
#     __tablename__ = "chat_session"
    
#     user_id : Mapped[int] = mapped_column(Integer, ForeignKey(User.id))
#     id : Mapped[str] = mapped_column(String(63), primary_key=True,index=True,autoincrement=True)
    
#     title : Mapped[str] = mapped_column(String(63))
#     created_time = Column(String(63), default = datetime.utcnow())
    
#     of_user : Mapped[User] = relationship("User",back_populates="have_sessions",uselist=False)   # 多对一
    # have_logs = relationship("ChatLog", back_populates="of_session")
    
    
# class ChatLog(Base):
#     __tablename__ = "chat_log"
    
#     user_id = Column(Integer,ForeignKey(User.id))
#     chatSession_id = Column(Integer,ForeignKey(ChatSession.id))
#     id = Column(Integer,primary_key=True,index=True)
    
#     content : Mapped[str] = mapped_column(TEXT)
    
#     of_session : Mapped[ChatSession] = relationship("ChatSession",back_populates="have_logs",uselist=False)
    
#     Index('idx_userId_chatSessionId_id',user_id,chatSession_id,id)
    
class Client(BaseModel): # 客户端
    __tablename__ =  "client"
    
    id : Mapped[int] = mapped_column(Integer, index= True, primary_key=True)
    
    secret : Mapped[str] = mapped_column(String(255), unique= True)
    created_time : Mapped[str] =  mapped_column(TIMESTAMP, default = datetime.utcnow())