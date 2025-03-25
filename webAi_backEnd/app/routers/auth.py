# routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from dependencies.auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_password_hash, verify_password
from schema.auth import Request_RegistryForm
from database.models import User  # 假设您已定义User模型
from database.core import get_async_db

router = APIRouter(prefix="/auth", tags=["认证相关"])

# ------------------------- 注册接口 -------------------------
@router.post("/register", status_code=201)
async def register(
    form_data: Request_RegistryForm,
    db: AsyncSession = Depends(get_async_db)
):
    """用户注册"""
    print('examing phone')
    # 检查手机号是否已存在
    existing_user = await db.execute(
        select(User).where(User.phone == form_data.phone)
    )
    if existing_user.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="手机号已被注册"
        )
    print('examing email')
    existing_user = await db.execute(
        select(User).where(User.email == form_data.email)
    )
    if existing_user.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="邮箱已被注册"
        )
    # =====================
    # to do: 添加邮箱、手机验证码操作
    # =====================
    # 创建新用户
    new_user = User(
        username=form_data.username,
        phone=form_data.phone,
        email=form_data.email,
        hashed_password=get_password_hash(form_data.password)
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {
        "message": "注册成功",
        "user_id": new_user.id,
        "username": new_user.username
    }

# ------------------------- 登录接口 -------------------------
@router.post("/login")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], # 强迫前端表单信息中的规范使用OAuth2
    db: AsyncSession = Depends(get_async_db)
):
    """用户登录"""
    # 根据手机号查找用户
    result = await db.execute(
        select(User).where(User.phone == form_data.username)  # OAuth2规范中username字段对应手机号
    )
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, str(user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="手机号或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 生成JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},  # 建议使用用户唯一标识
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "user_id": user.id,
            "username": user.username
        }
    }

# ------------------------- 需要补充的模型定义 -------------------------
"""
# models.py 示例
from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"
    
    uid = Column(Integer, primary_key=True, index=True)
    username = Column(String(50))
    phone = Column(String(20), unique=True, index=True)
    email = Column(String(100))
    hashed_password = Column(String(200))
    is_active = Column(Boolean, default=True)
"""