import os
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker,declarative_base

from database.models import BaseModel, Group

# 从环境变量获取连接信息
DATABASE_URL = "mysql+asyncmy://root:password@localhost:3306/mydb?charset=utf8mb4"

# 数据库异步引擎
async_engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
# 创建数据库会话
AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

# # 同步引擎 (备用)
# sync_engine = create_engine(DATABASE_URL.replace("+asyncmy", ""))
# SyncSessionLocal = sessionmaker(sync_engine)

# 在确保模型正确后，重置数据库（仅限开发环境！）
async def recreate_tables():
    print("recreating table...")
    async with async_engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.drop_all)
        await conn.run_sync(BaseModel.metadata.create_all)
    async with AsyncSessionLocal() as session:
        print("creating initial group...")
        group = Group(name = "base_group", assistant_id = "86f13f7410b311f0aa470242ac130006")
        session.add(group)
        await session.commit()
        
async def create_tables():
    print('creating table...')
    async with async_engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.create_all)
        
#初始化数据库表结构
async def init_db() :
    await create_tables()

# 获取异步会话的依赖
async def get_async_db():
    # print('getting async session')
    async with AsyncSessionLocal() as session:
        yield session
        