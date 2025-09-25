'''
接入RAGFlow，封装HTTP接口，
固定模型信息，
进行Assitant和Session、Databases的管理
'''

from http.client import HTTPException
import json
from pathlib import Path
from re import L
from typing import Optional
import httpx
from loguru import logger

from .schem import ChatAssistantConfig, Response_Chat, Response_GetSessions

from config import Config


class RAGFlowClient:
    '''封装RAGFlow API， 将HTTP API接口参数进行封装'''
    def __init__(self, base_url: str=Config.RAGFLOW_BASE_URL, api_key: str = Config.RAGFLOW_API_KEY):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    async def getAssistantList(self, filter_params:dict = {}, is_agent : bool = False)-> dict:
        '''获取助理列表'''
        if is_agent:
            url = f"{self.base_url}/api/v1/agents"
        else:
            url = f"{self.base_url}/api/v1/chats"
            
        if filter_params.get("page"):
            url += f'?page={filter_params["page"]}"'
        else:
            url += f"?page=1"
        if filter_params.get("page_size"):
            url += f'&page_size={filter_params["page_size"]}'
        if filter_params.get("orderby"):
            url += f'&orderby={filter_params["orderby"]}'
        if filter_params.get("desc"):
            url += f'&desc={filter_params["desc"]}'
        if filter_params.get("chat_name"):
            url += f'&name={filter_params["chat_name"]}'
        if filter_params.get("chat_id"):
            url += f'&id={filter_params["chat_id"]}'
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                url,
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()
    async def createAssistant(self, assistant : ChatAssistantConfig)-> dict:
        "根据指定的知识库创建助理"
        payload = assistant.__dict__
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/chats",
                headers=self.headers,
                params=payload
            )
            response.raise_for_status()
            return response.json()
    async def updateAssistant(self, assitant_id : str, updated_params : dict)->dict:
        '''
        修改assitant_id指定的助理配置
        @param args : 需要修改的参数字典
        '''
        payload = updated_params
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.put(
                f"{self.base_url}/api/v1/chats/{assitant_id}",
                headers=self.headers,
                params=payload
            )
            response.raise_for_status()
            return response.json()
    async def addDatasetsToAssistant(self, assistant_id:str, dataset_ids:list[str])->dict:
        '''将特定的datasets加到对应assistant_id中'''
        response = await self.getAssistantList({"chat_id":assistant_id})                  # 先查询对应的assitant
        raw_dataset_ids : list[str] = response["data"]["dataset_ids"]               # 提取原始数据库组
        response = await self.updateAssistant(assistant_id,raw_dataset_ids + dataset_ids) # 添加数据库组到assistant
        return response
        
    async def deleteAssistant(self, assistant_ids: list[str])->dict:
        "根据助理id列表批量删除对应助理"
        payload = {"ids":assistant_ids}
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.delete(
                f"{self.base_url}/api/v1/chats",
                headers=self.headers,
                params=payload
            )
            response.raise_for_status()
            return response.json()
    async def createSession(self,assistant_id : str, name : str = "test", user_id : str | None = None, is_agent : bool = False)-> dict:
        logger.debug(f"createSession user_id: {user_id}")
        "在指定助理基础上开启会话"
        if is_agent:
            url = f"{self.base_url}/api/v1/agents/{assistant_id}/sessions"
        else:
            url = f"{self.base_url}/api/v1/chats/{assistant_id}/sessions"
        payload = {
            "name" : name,
            "user_id" : user_id
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
    async def chat(self, assistant_id: str, question: str, session_id : Optional[str] = None, stream: bool = False, is_agent: bool = False):
        """对指定assistant，在指定会话中（若空则新建后再）进行一次对话"""
        if is_agent:
            url = f"{self.base_url}/api/v1/agents/{assistant_id}/completions"
        else:
            url = f"{self.base_url}/api/v1/chats/{assistant_id}/completions"
        payload = {
            "question": question,
            "stream": stream, 
            "session_id" : session_id
        }
        
        if stream:
            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream("POST",
                                    url,
                                    headers=self.headers,
                                    json=payload) as response:
                    response.raise_for_status()
                    session_id = ""
                    async for line in response.aiter_lines():
                        if line:
                            line = line.strip()
                            if line.startswith('data:'):
                                data = json.loads(line[5:].strip())
                                logger.debug(f"Chat Response:{data}")
                                if data.get('code') == 0:
                                    if isinstance(data.get('data'), bool):
                                        # 流式结束标记
                                        yield json.dumps({
                                            'type': 'end',
                                            'session_id' : session_id
                                            })
                                    elif is_agent and "running_status" in data.get("data"): # 说明agent还在运行
                                        logger.debug("Agent is running...")
                                    else:
                                        # 正常消息
                                        if ("session_id" in data["data"]):
                                            session_id = data["data"]["session_id"]
                                        yield json.dumps({
                                            'type': 'text',
                                            'content': data['data']['answer'],
                                            'session_id' : session_id
                                        })
        else:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    url,
                    headers=self.headers,
                    json=payload 
                )
                response.raise_for_status()
                logger.debug(f"Chat Response:{response.json()}")
                yield response.json()

    async def getSessionList(self, assistant_id : str, 
                       page : int = 1,
                       page_size : int = 30,
                       user_id : str = "",
                       session_id : str = "",
                       orderby : str = "create_time",
                       is_agent : bool = False
                       ):
        '''获取指定assitant的会话列表（按页访问），并提供筛选条件（会话id/会话名、排序方式等信息）'''
        user_id=""
        url = f"{self.base_url}/api/v1/{'agents' if is_agent else 'chats'}/{assistant_id}/sessions?page={page}&page_size={page_size}&orderby={orderby}&id={session_id}&user_id={user_id}"
        logger.debug(f"getSessionList begin at {url}")
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                url,
                headers=self.headers
            )
            response.raise_for_status()
            
            logger.debug(f"getSessionList done:{str(response.json())}")
            return response.json()
    
    async def deleteSession(self,assitant_id:str,
                      ids : list[str] = [],
                      is_agent : bool = False
                      )-> dict:
        "删除assitant_id指定的assitant下，ids列表对应的所有会话，如果为空，则删除所有会话"
        if is_agent:
            url = f"{self.base_url}/api/v1/agents/{assitant_id}/sessions"
        else:
            url = f"{self.base_url}/api/v1/chats/{assitant_id}/sessions"
        payload = {"ids" : ids}
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.request("DELETE",url, headers=self.headers,json=payload)
            response.raise_for_status()
            return response.json()
    
    async def uploadDocuments(self,dataset_id:str,file_path:str):
        """
        上传文件到 RAGFlow 指定数据集
        
        :param dataset_id: 目标数据集 ID
        :param file_path: 本地文件路径
        :param api_key: RAGFlow API 密钥
        :return: 响应结果
        """
        logger.debug("uploadDocuments...")
        async with httpx.AsyncClient(timeout=60.0) as client:
            with open(file_path, "rb") as f:
                files = [("file",(Path(file_path).name , f))]  # 保留原始文件名
                response = await client.post(
                    f"{self.base_url}/api/v1/datasets/{dataset_id}/documents",
                    headers={"Authorization": self.headers["Authorization"]},
                    files=files
                )
                logger.debug(f"upload done: {response.json()}")
                response.raise_for_status()
                return response.json()
    
    async def createDataset(self,name:str,description:str=""):
        '''
        创建知识库
        '''
        logger.debug("createDataset...")
        payload = {
            "name" : name,
            "description" : description
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/datasets",
                headers=self.headers,
                json = payload
            )
            logger.debug(f"createDataset Done:{response.json()}")
            return response.json()
    async def parseDocuments(self,dataset_id,document_ids:list[str]):
        logger.debug("parseDocuments...")
        payload = {
            "document_ids": document_ids
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/datasets/{dataset_id}/chunks",
                headers=self.headers,
                json = payload
            )
            response.raise_for_status
            logger.debug(f"parseDocuments done:{response.json()}")
            return response.json()
        
        

        

# 初始化客户端
rag_client = RAGFlowClient()

base_knowledge_base = "1658cfa410ac11f08f100242ac130006" # 基本知识库ids

# ================================== 接口函数 ======================================================================

# def handle_user_question(question: str, session_id : Optional[str] = None, kb_id : str = base_knowledge_base) -> str:
#     assitant : ChatAssistantConfig = ChatAssistantConfig(name = "test",dataset_ids=[kb_id])
#     try:
#         response = rag_client.getAssistantList()
#         logger.debug("RAGFlow 助理列表:", response)  # 新增此行
#         assitant_id = ""
#         for d in response["data"]:
#             if "name" in d and d["name"]==assitant.name:
#                 assitant_id = d["id"]
#                 logger.debug("RAGFLOW Already Exited Assitant:",d)
#         if not assitant_id:
#             response = rag_client.createAssistant(assitant)
#             assitant_id = response["data"]["id"]
#             logger.debug("RAGFLOW 创建助理:",response)
            
#         response = rag_client.chat(assitant_id,question,session_id)
#         logger.debug("RAGFLOW 对话:",response)
#         return response["data"]["answer"]
#     except requests.exceptions.HTTPError as e:
#         logger.debug("[ERROR] HTTP 请求失败:", e.response.text)  # 输出详细错误
#         return f"请求失败：{e.response.text}"
    
    