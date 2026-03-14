from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routes import devices, connect

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GeoNOC API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(devices.router, prefix="/devices", tags=["devices"])
app.include_router(connect.router, prefix="/connect", tags=["connect"])


@app.get("/")
def root():
    return {"message": "GeoNOC API is running"}
