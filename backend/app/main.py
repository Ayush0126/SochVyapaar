from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import auth, shop, metrics, analytics, insights, actions

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SochVyapaar API", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(shop.router)
app.include_router(metrics.router)
app.include_router(analytics.router)
app.include_router(insights.router)
app.include_router(actions.router)

@app.get("/")
def read_root():
    return {"message": "SochVyapaar API is running"}
