from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import os
import time
from dependencies.index import get_current_user
from database.models import User

router = APIRouter(
    prefix="/api/digital-person",
    tags=["digital-person"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/create-session")
async def create_digital_person_session(current_user: User = Depends(get_current_user)):
    """创建数字人会话"""
    try:
        # 生成唯一的会话ID
        session_id = f"{current_user.id}_{int(time.time())}"
        
        # 创建用户专属的视频存储目录
        video_dir = os.path.join('videos', current_user.username)
        os.makedirs(video_dir, exist_ok=True)
        
        return {
            "session_id": session_id,
            "video_dir": video_dir
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions")
async def get_digital_person_sessions(current_user: User = Depends(get_current_user)):
    """获取用户的数字人会话列表"""
    try:
        video_dir = os.path.join( 'videos', current_user.username)
        if not os.path.exists(video_dir):
            return []
            
        # 获取所有视频文件
        video_files = []
        for file in os.listdir(video_dir):
            if file.endswith('.mp4'):
                file_path = os.path.join(video_dir, file)
                video_files.append({
                    "filename": file,
                    "path": file_path,
                    "created_at": os.path.getctime(file_path)
                })
                
        # 按创建时间排序
        video_files.sort(key=lambda x: x["created_at"], reverse=True)
        return video_files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/video/{filename}")
async def get_digital_person_video(filename: str, current_user: User = Depends(get_current_user)):
    """获取指定视频文件"""
    try:
        video_path = os.path.join('videos', current_user.username, filename)
        if not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Video not found")
            
        return {
            "video_path": video_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/record")
async def record(session_id: str,current_user: User = Depends(get_current_user)):
    '''    数字人录制视频开始 or 暂停    '''
    try:
        # 验证会话ID是否属于当前用户
        if not session_id.startswith(str(current_user.id)):
            raise HTTPException(status_code=403, detail="Invalid session")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
            
        