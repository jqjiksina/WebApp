from pydantic import BaseModel

class Request_LoginForm(BaseModel):
    phone: str
    password: str
    email : str | None = None
    
class Request_RegistryForm(BaseModel):
    phone: str
    password: str
    username :str
    email : str | None = None
    