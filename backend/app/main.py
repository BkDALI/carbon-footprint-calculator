from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.init_db import init_db
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.calculations import router as calculations_router

app = FastAPI(
    title="Carbon Footprint Calculator API",
    description="API for calculating carbon footprint in Tunisia",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def home():
    return {"message": "Welcome to Carbon Footprint Calculator API"}


@app.get("/health")
def health():
    return {"status": "OK"}


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(calculations_router)