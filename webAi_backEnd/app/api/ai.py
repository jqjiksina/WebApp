'''
接入ai用
'''

class AiAPI:
    ai_name : str = "DeepSeek"
    ai_seqNum : str
    
    async def sendMessage(self, message : str):
        print("send messsage to ai")
        # 一会时间后得到response并返回
        return
    
    async def stopResponse(self)

def getAiAPI():
    return AiAPI()