from fastapi import FastAPI
from app.domains.institutions.router import router as institutions_router

app = FastAPI(
    title="EasyDocs API",
    description="Plataforma de gestión documental para instituciones ETDH",
    version="0.1.0"
)

@app.get("/")
def root():
    return {"status": "ok", "message": "EasyDocs API funcionando"}

app.include_router(institutions_router)

@app.get("/")
def root():
    return {"status": "ok", "message": "EasyDocs API funcionando"}