# from fastapi import Depends, Header, HTTPException
# from sqlalchemy import select
# from database.core import get_async_db
# from database.models import User
# from schema.auth import LoginForm
# from sqlalchemy.ext.asyncio import AsyncSession

# async def get_token_header(x_token: str = Header()):
#     if x_token != "fake-super-secret-token":
#         raise HTTPException(status_code=400, detail="X-Token header invalid")


# async def get_query_token(token: str):  # 把token与DB中登录用户表中的token进行比较
#     if token != "jessica":
#         raise HTTPException(status_code=400, detail="No Jessica token provided")
    
# async def validateFormData(formData: LoginForm, db : AsyncSession = Depends(get_async_db)): # 查找DB中是否有对应已经注册的手机号用户，并验证密码hash
#     print('validateFormData')
#     result = await db.execute(select(User).filter(User.phone == formData.phone))
#     if(result.scalar() != None):    # 如果结果非空，说明数据库中有重复的已注册的手机号
#         print('replicated phone')
#         return False
    