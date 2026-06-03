from fastapi import FastAPI

app = FastAPI(
    title="EasyDocs API",
    description="Plataforma de gestión documental para instituciones ETDH",
    version="0.1.0"
)

@app.get("/")
def root():
    return {"status": "ok", "message": "EasyDocs API funcionando"}