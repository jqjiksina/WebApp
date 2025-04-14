from typing import Optional
from pydantic import BaseModel
    
class Request_RegistryForm(BaseModel):
    universal_number : str              # 学号
    username     : str                  # 姓名
    password : str
    email : Optional[str]
    phone : Optional[str]
    