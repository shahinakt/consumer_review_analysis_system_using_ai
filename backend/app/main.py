import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models  # noqa: F401 -- ensures models are registered before create_all
from app.routers import predict, upload, dashboard, recommendations, health, auth


# Create tables on startup (fine for an MVP/SQLite; swap for Alembic later)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Review & Rating Analysis API",
    description="MVP backend serving sentiment predictions, uploads, dashboard KPIs and business recommendations.",
    version="1.0.0",
)

origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(upload.router)
app.include_router(dashboard.router)
app.include_router(recommendations.router)


@app.get("/")
def root():
    return {
        "message": "Customer Review & Rating Analysis API",
        "docs": "/docs",
        "endpoints": [
            "/health",
            "/auth/signup",
            "/auth/login",
            "/auth/logout",
            "/auth/me",
            "/predict",
            "/upload",
            "/dashboard",
            "/recommendations",
        ],
    }
