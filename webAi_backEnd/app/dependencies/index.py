

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import User
from database.core import get_async_db
# from schemas import LoginPost, RegistryPost  # 根据前端接口生成
from config import Config

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login") # tokenUrl指定获取token的url地址，以便于在受保护路由被访问时自动跳转到对应url获取token
# 安全配置
SECRET_KEY = Config.SECRET_KEY # 应从环境变量获取
ALGORITHM = Config.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = Config.ACCESS_TOKEN_EXPIRE_MINUTES

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
    print("[Debug] getting current user...")
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
    
    print("[Debug] get current user done")
    return user


# def get_dataset_by_user(user : User = Depends(get_current_user),
#                         db : AsyncSession = Depends(get_async_db)):
#     dataset_id = user.dataset_id
#     dat
#     pass

# async def check_group_member(
#     group_id: int,
#     user_id: int = Depends(get_current_user),
#     db : AsyncSession = Depends(get_async_db)
# ) -> Group:
#     '''依赖注入函数，验证并查询用户是否属于该群组id，并返回群组信息'''
#     print("[Debug] checking group ...")
#     if (group_id == 1): # base group id == 1
#         return (await db.execute(select(Group).where(Group.id == 1))).scalar()
#     result = await db.execute(select(Rel_UserGroup).
#                               where(
#                                   and_(Rel_UserGroup.user_id == user_id, 
#                                        Rel_UserGroup.group_id == group_id)))
#     result = result.scalar()
#     if not result:
#         raise HTTPException(status_code=403, detail="未加入该群组")
#     result = await db.execute(select(Group).where(Group.id == result.group_id))
#     result = result.scalar()
#     if not result:
#         raise HTTPException(status_code=404, detail="群组不存在")
#     return result