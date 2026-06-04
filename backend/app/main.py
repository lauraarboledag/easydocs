from fastapi import FastAPI
from fastapi.security import HTTPBearer
from app.domains.institutions.router import router as institutions_router
from app.domains.users.router import router as users_router

security = HTTPBearer()

app = FastAPI(
    title="EasyDocs API",
    description="Plataforma de gestión documental para instituciones ETDH",
    version="0.1.0",
    swagger_ui_init_oauth={},
)

@app.get("/")
def root():
    return {"status": "ok", "message": "EasyDocs API funcionando"}

app.include_router(institutions_router)
app.include_router(users_router)


@app.get("/")
def root():
    return {"status": "ok", "message": "EasyDocs API funcionando"}

@app.get("/")
def root():
    return {"status": "ok", "message": "EasyDocs API funcionando"}