from fastapi import FastAPI
from fastapi.security import HTTPBearer
from app.domains.institutions.router import router as institutions_router
from fastapi.middleware.cors import CORSMiddleware
from app.domains.users.router import router as users_router
from app.domains.subscriptions.router import router as subscriptions_router
from app.domains.documents.router import router as documents_router
from app.domains.edubot.router import router as edubot_router
from app.domains.students.router import router as students_router
from app.config import settings
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.domains.calendar.router import router as calendar_router

security = HTTPBearer()

app = FastAPI(
    title="EasyDocs API",
    description="Plataforma de gestión documental para instituciones ETDH",
    version="0.1.0",
    swagger_ui_init_oauth={},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://easydocs-kappa.vercel.app",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(institutions_router)
app.include_router(users_router)
app.include_router(subscriptions_router)
app.include_router(documents_router)
app.include_router(edubot_router)
app.include_router(students_router)
app.include_router(calendar_router)


@app.get("/")
def root():
    return {"status": "ok", "message": "EasyDocs API funcionando"}
