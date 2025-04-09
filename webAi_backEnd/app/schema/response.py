from datetime import datetime
from pydantic import BaseModel


class Response(BaseModel):
    message: str
    timestamp : str = datetime.utcnow().__str__()
    