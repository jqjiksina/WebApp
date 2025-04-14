# routes/auth.py
from api.ragflow.schem import ChatAssistantConfig
from schema.auth import Request_RegistryForm
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from api.auth.auth import create_access_token, get_password_hash, verify_password
from config import Config

from database.models import User  # 假设您已定义User模型
from database.core import get_async_db
from api.ragflow.ragflow import rag_client

router = APIRouter(prefix="/auth", tags=["认证相关"])

# ------------------------- 注册接口 -------------------------
@router.post("/register", status_code=201)
async def register(
    user: Request_RegistryForm,
    db: AsyncSession = Depends(get_async_db)
):
    """用户注册"""
    print('examing phone')
    # 检查手机号是否已存在
    existing_user = await db.execute(
        select(User).where(User.phone == user.phone)
    )
    if existing_user.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="手机号已被注册"
        )
    print('examing email')
    existing_user = await db.execute(
        select(User).where(User.email == user.email)
    )
    if existing_user.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="邮箱已被注册"
        )
    # =====================
    # TODO: 添加邮箱、手机验证码操作
    # =====================
    # 创建新用户
    
    # 先创建专属助理
    assistant_config = ChatAssistantConfig(name=f"{user.universal_number}_{user.username}_assistant")
    response = rag_client.createAssistant(assistant_config)
    assistant_id = response["data"]["id"]
    # TODO: 饿汉模式，直接创建专属数据库
    
    new_user = User(
        universal_number=user.universal_number,
        phone=user.phone,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        assistant_id = assistant_id
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {
        "message": "注册成功",
        "username": new_user.name
    }

# ------------------------- 登录接口 -------------------------
@router.post("/login")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], # 强迫前端表单信息中的规范使用OAuth2
    db: AsyncSession = Depends(get_async_db)
):
    """用户登录"""
    # 根据universal_number查找用户
    print("[Debug] user login:",form_data.username)
    result = await db.execute(
        select(User).where(User.universal_number == form_data.username)  # OAuth2规范中username字段对应universal_number
    )
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, str(user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="手机号或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 生成JWT
    access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},  # 建议使用用户唯一标识
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "user_id": user.id,
            "username": user.name
        }
    }