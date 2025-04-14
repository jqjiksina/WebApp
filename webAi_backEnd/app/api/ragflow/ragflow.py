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
import requests


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
    def getAssistantList(self, filter_params:dict = {})-> dict:
        '''获取助理列表'''
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
        response = requests.get(
            url,
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
    def updateAssistant(self, assitant_id : str, updated_params : dict)->dict:
        '''
        修改assitant_id指定的助理配置
        @param args : 需要修改的参数字典
        '''
        payload = updated_params
        response = requests.put(
            f"{self.base_url}/api/v1/chats/{assitant_id}",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    def addDatasetsToAssistant(self, assistant_id:str, dataset_ids:list[str])->dict:
        '''将特定的datasets加到对应assistant_id中'''
        response = self.getAssistantList({"chat_id":assistant_id})                  # 先查询对应的assitant
        raw_dataset_ids : list[str] = response["data"]["dataset_ids"]               # 提取原始数据库组
        response = self.updateAssistant(assistant_id,raw_dataset_ids + dataset_ids) # 添加数据库组到assistant
        return response
        
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
    def chat(self, assitant_id: str, question: str, session_id : Optional[str] = None, user_id : Optional[str] = None, stream: bool = False) -> Response_Chat:
        """对指定assitant，在指定会话中（若空则新建后再）进行一次对话"""
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
        print("[Debug] Chat Response:",response.json())
        response = response.json()
        def parse_sse_data(sse_str: str) -> dict:
            # 去除前缀和换行符
            json_str = sse_str.strip().replace("data:", "", 1)
            return json.loads(json_str)
        if response['data'] and type(response['data']) == str: # 说明新创建了一个会话
            parsed_data = parse_sse_data(response["data"])
            parsed_response = Response_Chat(**{
                **response,
                "data": parsed_data["data"]  # 提取嵌套的 data 字段
            })
            print("[Debug] parsed_response:",parsed_response)
            if question == "":
                return parsed_response
            # 如果question不为空，重新发送questiond到现在会话
            payload["session_id"] = parsed_response.data.session_id
            response = requests.post(
                f"{self.base_url}/api/v1/chats/{assitant_id}/completions",
                headers=self.headers,
                json=payload
            )
            return Response_Chat(**response.json())
        if question == "": # can't send empty message to existing session
            raise HTTPException()
        return Response_Chat(**response)

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
    
    def uploadDocuments(self,dataset_id:str,file_path:str):
        """
        上传文件到 RAGFlow 指定数据集
        
        :param dataset_id: 目标数据集 ID
        :param file_path: 本地文件路径
        :param api_key: RAGFlow API 密钥
        :return: 响应结果
        """
        print("[Debug] uploadDocuments...")
        with open(file_path, "rb") as f:
            # # 检查文件存在性
            # if not Path(file_path).exists():
            #     raise FileNotFoundError(f"文件不存在: {file_path}")

            # # 检查文件可读性
            # if not Path(file_path).is_file():
            #     raise PermissionError(f"无法读取文件: {file_path}")
            
            # print(Path(file_path).name,f)
            files = [("file",(Path(file_path).name , f))]  # 保留原始文件名
            response = requests.post(
                f"{self.base_url}/api/v1/datasets/{dataset_id}/documents",
                headers={"Authorization": self.headers["Authorization"]},
                files=files
            )
            print("[Debug] upload done",response.json())
            response.raise_for_status()
            return response.json()
    
    def createDataset(self,name:str,description:str=""):
        '''
        创建知识库
        '''
        print("[Debug] createDataset...")
        payload = {
            "name" : name,
            "description" : description
        }
        response = requests.post(
            f"{self.base_url}/api/v1/datasets",
            headers=self.headers,
            json = payload
        )
        print("[Debug] createDataset Done:",response.json())
        return response.json()
    def parseDocuments(self,dataset_id,document_ids:list[str]):
        print("[Debug] parseDocuments...")
        payload = {
            "document_ids": document_ids
        }
        response = requests.post(
            f"{self.base_url}/api/v1/datasets/{dataset_id}/chunks",
            headers=self.headers,
            json = payload
        )
        response.raise_for_status
        print("[Debug] parseDocuments done:",response)
        return response.json()
        
        

        

# 初始化客户端
rag_client = RAGFlowClient()

base_knowledge_base = "1658cfa410ac11f08f100242ac130006" # 基本知识库id

# ================================== 接口函数 ======================================================================

# def handle_user_question(question: str, session_id : Optional[str] = None, kb_id : str = base_knowledge_base) -> str:
#     assitant : ChatAssistantConfig = ChatAssistantConfig(name = "test",dataset_ids=[kb_id])
#     try:
#         response = rag_client.getAssistantList()
#         print("[DEBUG] RAGFlow 助理列表:", response)  # 新增此行
#         assitant_id = ""
#         for d in response["data"]:
#             if "name" in d and d["name"]==assitant.name:
#                 assitant_id = d["id"]
#                 print("[DEBUG] RAGFLOW Already Exited Assitant:",d)
#         if not assitant_id:
#             response = rag_client.createAssistant(assitant)
#             assitant_id = response["data"]["id"]
#             print("[DEBUG] RAGFLOW 创建助理:",response)
            
#         response = rag_client.chat(assitant_id,question,session_id)
#         print("[DEBUG] RAGFLOW 对话:",response)
#         return response["data"]["answer"]
#     except requests.exceptions.HTTPError as e:
#         print("[ERROR] HTTP 请求失败:", e.response.text)  # 输出详细错误
#         return f"请求失败：{e.response.text}"
    
    