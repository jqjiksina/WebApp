'''
接入RAGFlow，并通过HTTP接口进行Assitant和Session、Databases的管理
'''

import string
from urllib import response
from attr import s
from flask import session
from numpy import void
import requests
from typing import Optional

from sympy import false
from .schem import ChatAssistantConfig, Response_Chat, Response_GetSessions

    

class RAGFlowClient:
    '''封装RAGFlow API， 将HTTP API接口参数进行封装'''
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    def getAssistantList(self):
        '''获取助理列表'''
        response = requests.get(
            f"{self.base_url}/api/v1/chats",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json()
    def createAssistant(self, assitant : ChatAssistantConfig)-> dict:
        "根据指定的知识库创建助理"
        payload = assitant.__dict__
        response = requests.post(
            f"{self.base_url}/api/v1/chats",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    def updateAssistant(self, assitant_id : str, updated_Assitant : ChatAssistantConfig)->dict:
        "修改assitant_id指定的助理配置"
        payload = updated_Assitant.__dict__
        response = requests.put(
            f"{self.base_url}/api/v1/chats/{assitant_id}",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    def deleteAssistant(self, assitant_ids: list[str])->dict:
        "根据助理id列表批量删除对应助理"
        payload = {"ids":assitant_ids}
        response = requests.delete(
            f"{self.base_url}/api/v1/chats",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    def createSession(self,assitant_id : str, name : str = "test", user_id : str | None = None)-> dict:
        "在指定助理基础上开启会话"
        payload = {
            "name" : name,
            "user_id" : user_id
        }
        response = requests.post(
            f"{self.base_url}/api/v1/chats/{assitant_id}/sessions",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    def chat(self, assitant_id: str, question: str, session_id : str|None = None, user_id : str|None = None, stream: bool = False) -> Response_Chat:
        """对指定assitant，在指定会话中（若空则新建）进行一次对话"""
        payload = {
            "question": question,
            "stream": stream, 
            "session_id" : session_id,
            "user_id" : user_id
        }
        response = requests.post(
            f"{self.base_url}/api/v1/chats/{assitant_id}/completions",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()

    # def upload_document(self, kb_id: str, file_path: str) -> str:
    #     """上传文档"""
    #     files = {'file': open(file_path, 'rb')}
    #     data = {'knowledge_base_id': kb_id}
    #     response = requests.post(
    #         f"{self.base_url}/api/v1/upload",
    #         headers={"Authorization": self.headers["Authorization"]},
    #         files=files,
    #         data=data
    #     )
    #     response.raise_for_status()
    #     return response.json()["task_id"]  # 返回异步任务ID

    def getSessionList(self, assistant_id : str, 
                       page : int = 1,
                       page_size : int = 30,
                       user_id : str = "",
                       session_id : str = "",
                       session_name : str = "",
                       orderby : str = "create_time",
                       desc : bool = False
                       )-> Response_GetSessions:
        '''获取指定assitant的会话列表（按页访问），并提供筛选条件（会话id/会话名、排序方式等信息）'''
        response = requests.get(
            f"{self.base_url}/api/v1/chats/{assistant_id}/sessions?page={page}&page_size={page_size}&orderby={orderby}&desc={desc}&name={session_name}&id={session_id}&user_id={user_id}",
            headers=self.headers
        )
        response.raise_for_status()
        
        print("[Debug] getChatSession done:",str(response.json())[:200])
        return Response_GetSessions(**response.json())
    
    def deleteSession(self,assitant_id:str,
                      ids : list[str] = []
                      )-> dict:
        "删除assitant_id指定的assitant下，ids列表对应的所有会话，如果为空，则删除所有会话"
        payload = {"ids" : ids}
        response = requests.delete(f"{self.base_url}/api/v1/chats/{assitant_id}/sessions", headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()

        

# 初始化客户端
rag_client = RAGFlowClient(
    base_url="http://localhost:8080", 
    api_key="ragflow-NjMDE4OTE4MTBmYjExZjBiNzQwMDI0Mm"
)

base_knowledge_base = "1658cfa410ac11f08f100242ac130006" # 基本知识库id

# ================================== 接口函数 ======================================================================

def handle_user_question(question: str, session_id : Optional[str] = None, kb_id : str = base_knowledge_base) -> str:
    assitant : ChatAssistantConfig = ChatAssistantConfig(name = "test",dataset_ids=[kb_id])
    try:
        response = rag_client.getAssistantList()
        print("[DEBUG] RAGFlow 助理列表:", response)  # 新增此行
        assitant_id = ""
        for d in response["data"]:
            if "name" in d and d["name"]==assitant.name:
                assitant_id = d["id"]
                print("[DEBUG] RAGFLOW Already Exited Assitant:",d)
        if not assitant_id:
            response = rag_client.createAssistant(assitant)
            assitant_id = response["data"]["id"]
            print("[DEBUG] RAGFLOW 创建助理:",response)
            
        response = rag_client.chat(assitant_id,question,session_id)
        print("[DEBUG] RAGFLOW 对话:",response)
        return response["data"]["answer"]
    except requests.exceptions.HTTPError as e:
        print("[ERROR] HTTP 请求失败:", e.response.text)  # 输出详细错误
        return f"请求失败：{e.response.text}"
    
    