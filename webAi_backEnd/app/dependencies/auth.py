

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from database.core import get_async_db
from jose import JWTError, jwt
from time import timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import User
# from schemas import LoginPost, RegistryPost  # 根据前端接口生成
from database.core import get_async_db
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login") # tokenUrl指定获取token的url地址，以便于在受保护路由被访问时自动跳转到对应url获取token
# 安全配置
SECRET_KEY = os.getenv("RSA_PRIVATE_KEY_BACKENDSERVER","your-secret-key-here") # 应从环境变量获取
print(SECRET_KEY)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ------------------------- 工具函数 -------------------------
def verify_password(plain_password: str, hashed_password: str):
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    """生成密码哈希"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """创建JWT令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ---------------------- 依赖项 ------------------------------------
async def get_current_user(token: str = Depends(oauth2_scheme), db : AsyncSession = Depends(get_async_db)) -> User:
    """
    依赖注入函数：验证JWT令牌并返回当前用户
    功能分解：
    1. 通过Depends(oauth2_scheme)自动从请求头获取token（格式：Bearer <token>）
    2. 解码JWT验证签名和有效期
    3. 从数据库查询对应用户
    4. 返回用户对象供路由使用
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 解码JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload["sub"]
        # print ("token payload: ", payload,
        #        "\n token username : ", username)
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # 查询数据库
    user = await db.execute(select(User).where(User.id == username))
        # user = await db.execute(select(User).where(User.phone == username))
        
    user = user.scalars().first()
    if user is None:
        raise credentials_exception
    return user