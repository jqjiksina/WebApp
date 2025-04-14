from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from api.auth.auth import get_password_hash
from config import Config
from database.models import BaseModel, User

# 从环境变量获取连接信息
DATABASE_URL = Config.DATABASE_URL

# 数据库异步引擎
async_engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
# 创建数据库会话
AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

# 在确保模型正确后，重置数据库（仅限开发环境！）
async def recreate_tables():
    print("recreating table...")
    async with async_engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.drop_all)
        await conn.run_sync(BaseModel.metadata.create_all)
    async with AsyncSessionLocal() as session:
        print("creating initial group...")
        # 添加基本group
        # group = Group(name = "base_group", assistant_id = "3bfb2be8176f11f0b9b02231d20fc9ca")
        # session.add(group)
        # 添加基本管理员用户
        admin = User(name = "admin", universal_number = "Admin", hashed_password = get_password_hash("admin"),
                     assistant_id=Config.DEFAULT_ASSISTANT_ID, dataset_id=Config.DEFAULT_DATASET_ID)
        session.add(admin)
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
    print('[Debug] getting db...')
    async with AsyncSessionLocal() as session:
        yield session
        