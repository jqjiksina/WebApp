from typing import Literal
from sqlalchemy import update
from api.ragflow.schem import Response_Chat
from schema.chat import Request_ChatLog, Response_PostChatLog
from database.core import get_async_db
from fastapi import APIRouter, File, UploadFile, HTTPException,Depends, status
from fastapi.responses import JSONResponse, StreamingResponse
from pathlib import Path
import uuid
import shutil
from api.ragflow.ragflow import rag_client
from dependencies.index import get_current_user
from database.models import User
from sqlalchemy.ext.asyncio import AsyncSession
import subprocess
import json

router = APIRouter(
    tags=["resume"])


# 配置文件存储路径
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)  # 自动创建上传目录

@router.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...),
                        user:User = Depends(get_current_user),
                        db:AsyncSession = Depends(get_async_db)):
    '''
    接受前端上传的简历文件，并发往ragflow进行进一步处理，
    如果用户还没有关联自己的数据库，那么关联之。
    '''
    # 生成唯一文件名防止覆盖
    print("[Debug] upload resume...")
    file_ext = Path(file.filename).suffix
    file_id = f"resume_{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / file_id

    # 保存文件到本地
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ========== 这里是RAGFlow处理区域 ==========
    # 可以在此处调用RAGFlow的文档处理接口
    # 示例伪代码：
    if not user.dataset_id:
        response = rag_client.createDataset(f'{user.name}_{user.external_id}',f"{user.name}_{user.external_id}'s dataset")
        user.dataset_id = response["data"]["id"]
        await db.execute(update(User).where(User.id == user.id).values(dataset_id = user.dataset_id))
        
    response = rag_client.uploadDocuments(user.dataset_id,file_path)
    # 上传完毕后删除服务器中转临时文件
    subprocess.call(["rm",file_path])
    response = rag_client.parseDocuments(user.dataset_id,[response["data"][0]["id"]])
    
    # ========================================

    # 返回文件唯一标识符
    return JSONResponse(
        status_code=200,
        content={"data": file_id}  # 与前端类型 { data: string } 匹配
    )
    
@router.post("/api/resume/chat")
async def chat_resume(request : Request_ChatLog,
                      user : User = Depends(get_current_user)):
    # 先根据当前模式（简历模式和特定用户）得到相应的助理id
    # 如果第一次开始对话，那么创建会话
    # 否则直接在指定session_id上继续对话
    assistant_id = user.assistant_id
    print("[Debug] chat_resume on session_id:",request.session_id)
    
    try:
        # 如果没有session_id，创建一个新的会话
        if not request.session_id:
            # 创建新会话
            session_response = rag_client.createSession(assistant_id, "简历分析会话", user.external_id)
            if session_response and session_response.get("data"):
                request.session_id = session_response["data"]["id"]
        
        # 设置流式传输
        response = rag_client.chat(assistant_id,
                                 request.content,
                                 request.session_id,
                                 user.external_id,
                                 stream=True)
        stream = True
        # 对于流式响应，直接返回生成器
        if stream:
            async def generate():
                for chunk in response:
                    # print("one stream:",chunk)
                    
                    yield f"data: {chunk}\n\n"
            print("stream down")
            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        
        # 非流式响应的处理
        if Response_Chat.is_error(response):
            raise HTTPException(status_code=status.HTTP_204_NO_CONTENT,
                              detail="输入content为空")
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response_PostChatLog(
            session_id=response.data.session_id,
            content=response.data.answer
        )
    except Exception as e:
        print(f"[Error] chat_resume error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"处理请求时发生错误: {str(e)}"
        )
        
@router.get("/api/resume/newSession")
async def new_session(user : User = Depends(get_current_user)):
    '''创建新的会话'''
    assistant_id = user.assistant_id
    session_response = rag_client.createSession(assistant_id, "简历分析会话", user.external_id)
    if session_response and session_response.get("data"):
        return {"code" : 200,
                "message" : "new session succeed",
                "data":{"session_id" : session_response["data"]["id"]}}

# 添加文件大小限制中间件（可选）
# @app.middleware("http")
# async def add_file_size_limit(request, call_next):
#     # 限制上传文件大小为50MB
#     MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB
#     content_length = int(request.headers.get('content-length', 0))
    
#     if content_length > MAX_UPLOAD_SIZE:
#         return JSONResponse(
#             status_code=413,
#             content={"error": "文件大小超过50MB限制"}
#         )
    
    # return await call_next(request)