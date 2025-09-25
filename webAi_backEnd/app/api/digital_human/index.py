# '''数字人相关API'''

# from fastapi import HTTPException
# import httpx
# from database.models import User

# class DigitalHuman:
#     '''数字人相关API'''
#     def __init__(self, base_url : str = "http://localhost:5180/digitalperson"):
#         self.base_url = base_url

#     async def play(self, text : str, human_session_id : int, interrupt : bool = False):
#         '''    让指定session_id的数字人播放指定文字    '''
#         print("[Debug] start Play text:",text,"at session",human_session_id)
#         url = f"{self.base_url}/human"
#         async with httpx.AsyncClient() as client:
#             try:
#                 response = await client.post(url, json={"text": text, "sessionid": human_session_id, "type": "echo", "interrupt": interrupt})
#                 response.raise_for_status()
#             except:
#                 print("[Debug] play错误，请检查数字人id是否正确！")
#             print("[Debug] end Play text response:",response)
#             return response.json()


# digital_human = DigitalHuman()