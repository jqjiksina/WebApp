api_key = "d393vfl89a6gqlk28cdg"
api_url = "https://agent.hust.edu.cn/api/proxy/api/v1"

import json
from typing import Optional
import httpx
from loguru import logger

class HiAgent:
    def __init__(self, api_key, api_url):
        self.api_key = api_key
        self.api_url = api_url
        self.headers = {"Apikey": api_key,
                        "Content-Type": "application/json"}
    
    async def createSession(self, user_id : str, inputs : Optional[map]=None)->dict:
        async with httpx.AsyncClient(timeout=60.0) as client:
            url = self.api_url + "/create_conversation"
            response = await client.post(url, headers=self.headers, 
                                         json={"UserID": user_id, "Inputs": inputs})
            response.raise_for_status()
            return response.json()
        
    async def chat(self, session_id : str, user_id : str, query : str, query_extends : Optional[dict]=None, response_mode : str = "streaming"):
        async with httpx.AsyncClient(timeout=180.0) as client:
            url = self.api_url + "/chat_query_v2"
            payload = {"AppConversationID": session_id, "UserID": user_id, "Query": query, 
                        "QueryExtends": query_extends, "ResponseMode": response_mode}
            if response_mode == "streaming":
                async with client.stream("POST",url, headers=self.headers, json=payload) as response:
                    async for line in response.aiter_lines():
                        line = line.strip()
                        logger.debug(f"line message: {line}")
                        if not line.startswith('data:'):
                            continue
                        data = json.loads(line[5:].strip())
                        if data["event"] == "message":
                            yield json.dumps({
                                "type" : "text",
                                "content" : data["answer"],
                                "session_id" : data["conversation_id"],
                                # "message_id" : data["id"]
                            })
                        elif data["event"] == "message_end":
                            yield json.dumps({
                                "type" : "end",
                                "session_id" : data["conversation_id"],
                                # "message_id" : data["id"]
                            })
            else:
                response = await client.post(url,headers=self.headers,json=payload)
                response.raise_for_status()
                yield response.json()
                
    async def rechat(self, session_id : str, user_id : str, message_id : str):
        async with httpx.AsyncClient(timeout=60.0) as client:
            url = self.api_url + "/query_again"
            payload = {"AppConversationID": session_id, "UserID": user_id, "MessageID": message_id}
            async with client.stream("POST",url, headers=self.headers, json=payload) as response:
                    session_id = ""
                    message_id = ""
                    async for line in response.aiter_lines():
                        line = line.strip()
                        data = json.loads(line.strip())
                        if data["event"] == "message":
                            session_id = data["conversation_id"]
                            message_id = data["id"]
                            yield json.dumps({
                                "type" : "text",
                                "content" : data["answer"],
                                "session_id" : data["conversation_id"],
                                "message_id" : data["id"]})
                        elif data["event"] == "message_end":
                            yield json.dumps({
                                "type" : "end",
                                "session_id" : session_id,
                                "message_id" : message_id
                            })
                            
    async def getSessionList(self, user_id : str):
        '''返回指定用户的所有会话列表，不包括会话内的Message'''
        async with httpx.AsyncClient(timeout = 60) as client:
            url = self.api_url + "/get_conversation_list"
            payload = {"UserID" : user_id}
            response = await client.post(url,headers=self.headers,json=payload)
            response.raise_for_status()
            return response.json()
        
    async def updateSession(self, session_id : str, user_id, session_name : str):
        '''更改会话名字'''
        async with httpx.AsyncClient(timeout=60) as client:
            url = self.api_url + "/update_conversation"
            payload = {"AppConversationID" : session_id, "UserID" : user_id, "ConversationName" : session_name}
            response = await client.post(url, headers=self.headers, json = payload)
            response.raise_for_status()
            return response.json()
        
    async def deleteSession(self, session_id : str, user_id : str):
        async with httpx.AsyncClient(timeout=60.0) as client:
            url = self.api_url + "/delete_conversation"
            payload = {"AppConversationID" : session_id, "UserID" : user_id}
            response = await client.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        
    async def getMessageHistory(self, session_id : str, user_id : str, limit : int = 100):
        '''获取指定会话的历史消息列表'''
        async with httpx.AsyncClient(timeout=60.0) as client:
            url = self.api_url + "/get_conversation_messages"
            payload = {"AppConversationID" : session_id, "UserID" : user_id, "Limit" : limit, "AppKey" : self.api_key}
            response = await client.post(url, headers=self.headers, json = payload)
            response.raise_for_status()
            return response.json()
        
    async def deleteMessage(self, message_id : str, user_id :str):
        async with httpx.AsyncClient(timeout=60.0) as client:
            url = self.api_url + "/delete_message"
            payload = {"MessageID" : message_id, "UserID" : user_id}
            response = await client.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        
    async def feedback(self, message_id : str, user_id :str ,like_type : int):
        async with httpx.AsyncClient(timeout=60.0) as client:
            url = self.api_url + "/feedback"
            payload = {"MessageID" : message_id, "UserID" : user_id, "LikeType" : like_type}
            response = await client.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        
hiagent = HiAgent(api_key,api_url)