import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routers import auth as auth_router
from .routers import users as users_router
from .routers import meds as meds_router
from .routers import doses as doses_router
from .routers import chat as chat_router
from fastapi import APIRouter

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedMinder Backend", version="0.1.0")

# CORS: allow comma-separated env like "http://localhost:3000,http://127.0.0.1:3000"
origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# versioned API
api_v1 = APIRouter(prefix="/v1")
api_v1.include_router(auth_router.router)
api_v1.include_router(users_router.router)
api_v1.include_router(meds_router.router)
api_v1.include_router(doses_router.router)
api_v1.include_router(chat_router.router)
app.include_router(api_v1)

@app.get("/")
def root():
    return {"ok": True, "message": "MedMinder API. See /v1/*"}
