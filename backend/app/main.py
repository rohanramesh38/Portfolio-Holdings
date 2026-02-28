from fastapi import FastAPI
from app.core.config import settings

from app.api.routers.transactions import router as transactions_router
from app.api.routers.holdings import router as holdings_router
from app.api.routers.summary import router as summary_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=settings.APP_NAME)

app.include_router(transactions_router)
app.include_router(holdings_router)
app.include_router(summary_router)

@app.get("/health")
def health():
    return {"status": "ok", "env": settings.ENV}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)