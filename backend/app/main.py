from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from app.domains.institutions.router import router as institutions_router
from app.domains.users.router import router as users_router
from app.domains.subscriptions.router import router as subscriptions_router
from app.domains.documents.router import router as documents_router
from app.domains.edubot.router import router as edubot_router
from app.domains.students.router import router as students_router
from app.domains.calendar.router import router as calendar_router
from app.config import settings
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

app = FastAPI(
    title="EasyDocs API",
    description="Plataforma de gestión documental para instituciones ETDH",
    version="0.1.0",
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
    expose_headers=["*"],
)

@app.middleware("http")
async def cors_preflight_handler(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response()
        origin = request.headers.get("origin", "*")
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "600"
        return response
    return await call_next(request)

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