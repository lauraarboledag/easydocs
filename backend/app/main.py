from fastapi import FastAPI
from fastapi.security import HTTPBearer
from app.domains.institutions.router import router as institutions_router
from fastapi.middleware.cors import CORSMiddleware
from app.domains.users.router import router as users_router
from app.domains.subscriptions.router import router as subscriptions_router
from app.domains.documents.router import router as documents_router
from app.domains.edubot.router import router as edubot_router

security = HTTPBearer()

app = FastAPI(
    title="EasyDocs API",
    description="Plataforma de gestión documental para instituciones ETDH",
    version="0.1.0",
    swagger_ui_init_oauth={},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(institutions_router)
app.include_router(users_router)
app.include_router(subscriptions_router)
app.include_router(documents_router)
app.include_router(edubot_router)

@app.get("/")
def root():
    return {"status": "ok", "message": "EasyDocs API funcionando"}
