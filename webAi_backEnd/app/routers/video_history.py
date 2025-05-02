from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from typing import List
import os
from datetime import datetime
from dependencies.index import get_current_user
from database.models import User

router = APIRouter(
    prefix="/video-history",
    tags=["video-history"],
    dependencies=[Depends(get_current_user)]
)

# 视频文件存储目录
VIDEO_STORAGE_DIR = "videos"

@router.get("/list", response_model=List[dict])
async def get_video_list(current_user: User = Depends(get_current_user)):
    """
    获取用户的视频历史记录列表
    """
    try:
        # 确保视频存储目录存在
        os.makedirs(VIDEO_STORAGE_DIR, exist_ok=True)
        
        # 获取用户专属的视频目录
        user_video_dir = os.path.join(VIDEO_STORAGE_DIR, current_user.username)
        if not os.path.exists(user_video_dir):
            return []
            
        # 获取所有视频文件
        video_files = []
        for filename in os.listdir(user_video_dir):
            if filename.endswith('.mp4'):
                file_path = os.path.join(user_video_dir, filename)
                file_stat = os.stat(file_path)
                
                # 从文件名中提取会话ID和时间戳
                # 文件名格式: session_id_timestamp.mp4
                parts = filename.split('_')
                if len(parts) >= 2:
                    session_id = parts[0]
                    timestamp = int(parts[1].split('.')[0])
                    created_time = datetime.fromtimestamp(timestamp)
                    
                    video_files.append({
                        "session_id": session_id,
                        "filename": filename,
                        "created_time": created_time.isoformat(),
                        "size": file_stat.st_size,
                        "duration": 0  # 需要额外处理获取视频时长
                    })
        
        # 按创建时间排序
        video_files.sort(key=lambda x: x["created_time"], reverse=True)
        return video_files
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取视频列表失败: {str(e)}"
        )

@router.get("/{filename}")
async def get_video(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    获取指定的视频文件
    """
    try:
        # 构建完整的文件路径
        file_path = os.path.join(VIDEO_STORAGE_DIR, current_user.username, filename)
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="视频文件不存在"
            )
            
        # 返回视频文件
        return FileResponse(
            file_path,
            media_type="video/mp4",
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取视频文件失败: {str(e)}"
        ) 