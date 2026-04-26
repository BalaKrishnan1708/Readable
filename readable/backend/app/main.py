from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, lessons, sessions, students, teacher


app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(teacher.router, prefix="/teacher", tags=["teacher"])


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
