from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./nagarai.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Issue(Base):
    __tablename__ = "issues"

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String, nullable=False)
    description   = Column(Text)
    issue_type    = Column(String)          # pothole, garbage, streetlight, etc.
    severity      = Column(String)          # low, medium, high, critical
    status        = Column(String, default="open")   # open, in_progress, resolved
    latitude      = Column(Float)
    longitude     = Column(Float)
    ward          = Column(String)
    address       = Column(String)
    photo_url     = Column(String)
    economic_loss = Column(Float, default=0)        # ₹ loss per day
    economic_note = Column(Text)                    # explanation from Gemini
    reporter_name = Column(String, default="Citizen")
    reporter_phone= Column(String)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at   = Column(DateTime, nullable=True)
    is_duplicate  = Column(Boolean, default=False)
    parent_id     = Column(Integer, nullable=True)  # merged into this issue
    occurrence_count = Column(Integer, default=1)   # for ghost issue detection


class AgentAction(Base):
    __tablename__ = "agent_actions"

    id          = Column(Integer, primary_key=True, index=True)
    issue_id    = Column(Integer)
    action_type = Column(String)   # complaint_email, twitter_thread, rti_pdf
    content     = Column(Text)     # generated text / PDF path
    triggered_at= Column(DateTime, default=datetime.utcnow)
    day_trigger  = Column(Integer) # 3, 7, or 14


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
