from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import subprocess

from database import engine, Base, SessionLocal, Issue
from routes import issues, actions, dashboard
from services.scheduler import start_scheduler

def auto_seed_if_empty():
    """Runs on every server startup. If the database is empty (fresh deploy,
    free-tier restart, etc), automatically seeds demo data so the live link
    always works for anyone who opens it, regardless of when."""
    db = SessionLocal()
    try:
        existing = db.query(Issue).count()
        if existing == 0:
            db.close()
            print("[Startup] Database empty — auto-seeding demo data...")
            result = subprocess.run(["python", "seed_data.py"], capture_output=True, text=True)
            print(result.stdout)
            if result.stderr:
                print("[Startup] Seed stderr:", result.stderr)
        else:
            print(f"[Startup] Database already has {existing} issues — skipping seed.")
            db.close()
    except Exception as e:
        print(f"[Startup] Auto-seed check failed: {e}")
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    auto_seed_if_empty()
    start_scheduler()
    yield

app = FastAPI(title="NagarAI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
os.makedirs("rti_pdfs", exist_ok=True)
app.mount("/uploads",  StaticFiles(directory="uploads"),  name="uploads")
app.mount("/rti_pdfs", StaticFiles(directory="rti_pdfs"), name="rti_pdfs")

app.include_router(issues.router,    prefix="/api/issues",    tags=["Issues"])
app.include_router(actions.router,   prefix="/api/actions",   tags=["Actions"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

@app.get("/")
def root():
    return {"status": "NagarAI is alive", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/seed-now-once")
def seed_now_once():
    db = SessionLocal()
    existing = db.query(Issue).count()
    if existing > 0:
        db.close()
        return {"message": f"Already seeded with {existing} issues. Skipping."}
    db.close()
    result = subprocess.run(["python", "seed_data.py"], capture_output=True, text=True)
    return {"message": "Seeding complete", "output": result.stdout, "error": result.stderr}