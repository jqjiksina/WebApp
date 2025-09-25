import os
from dotenv import load_dotenv
from typing import Optional

# 加载 .env 文件（开发环境）
load_dotenv(override=True)  # override=True 确保环境变量优先使用 .env 中的值

class Config:
    # 必填项（未设置时会抛出明确错误）
    DEFAULT_ASSISTANT_ID: str = os.getenv("DEFAULT_ASSISTANT_ID")
    DEFAULT_CONVERSATION_ID : str = os.getenv("DEFAULT_CONVERSATION_ID")
    FRONT_END_URL : str = os.getenv("FRONT_END_URL")
    DATABASE_URL : str = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("RSA_PRIVATE_KEY_BACKENDSERVER") # 应从环境变量获取
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    RAGFLOW_BASE_URL = os.getenv("RAGFLOW_BASE_URL")
    RAGFLOW_API_KEY = os.getenv("RAGFLOW_API_KEY")
    DEFAULT_DATASET_ID = os.getenv("DEFAULT_DATASET_ID")
    
    # Agent ID
    INTERVIEW_AGENT_ID = os.getenv("INTERVIEW_AGENT_ID")
    RESUME_AGENT_ID = os.getenv("RESUME_AGENT_ID")
    
    PAPER_TEST_API_KEY = os.getenv("PAPER_TEST_API_KEY")
    AGENT_HUST_ADDRESS = os.getenv("AGENT_HUST_ADDRESS")
    
    # 管理员用户配置
    DEFAULT_USER_UNIVERSAL_NUMBER = os.getenv("DEFAULT_USER_UNIVERSAL_NUMBER")
    DEFAULT_USER_PASSWORD = os.getenv("DEFAULT_USER_PASSWORD")

    DEBUG_MODE: bool = os.getenv("DEBUG_MODE", True)