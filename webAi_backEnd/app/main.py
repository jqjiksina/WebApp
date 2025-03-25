from fastapi import Depends, FastAPI,Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import time

from database.core import init_db
from routers import items,users,auth,chat

@asynccontextmanager
async def on_startup(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=on_startup)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins = 'http://localhost:5173',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],)

app.include_router(items.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(chat.router)

@app.get('/')
def root():
    return {"message": "Hello World"}


if __name__ == '__main__':
    uvicorn.run('main:app',port=8888,host='localhost',reload=True)