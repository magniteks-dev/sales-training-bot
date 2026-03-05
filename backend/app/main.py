from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, training, chat, roleplay, voice, exam, progress, admin

app = FastAPI(title="Sales Training Bot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(training.router, prefix="/api/training", tags=["training"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(roleplay.router, prefix="/api/roleplay", tags=["roleplay"])
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
app.include_router(exam.router, prefix="/api/exam", tags=["exam"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/")
async def root():
    return {"status": "ok", "service": "Sales Training Bot API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
