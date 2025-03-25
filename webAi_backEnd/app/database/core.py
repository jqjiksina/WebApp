import os
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker,declarative_base

from database.models import Base

# 从环境变量获取连接信息
DATABASE_URL = "mysql+asyncmy://root:password@localhost:3306/mydb"

# 数据库异步引擎
async_engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
# 创建数据库会话
AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

# # 同步引擎 (备用)
# sync_engine = create_engine(DATABASE_URL.replace("+asyncmy", ""))
# SyncSessionLocal = sessionmaker(sync_engine)

#初始化数据库表结构
async def init_db() :
    print('creating table...')
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# 获取异步会话的依赖
async def get_async_db():
    print('getting async session')
    async with AsyncSessionLocal() as session:
        yield session