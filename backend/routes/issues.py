from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional
import math, os, shutil, uuid

from database import get_db, Issue
from services.gemini import classify_issue, calculate_economic_impact, extract_from_voice

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def haversine_distance(lat1, lon1, lat2, lon2) -> float:
    """Returns distance in meters between two GPS coordinates."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def find_duplicate(db: Session, lat: float, lon: float, issue_type: str) -> Optional[Issue]:
    """Check if same issue exists within 50 meters."""
    nearby = db.query(Issue).filter(
        Issue.issue_type == issue_type,
        Issue.status != "resolved",
        Issue.is_duplicate == False
    ).all()
    for existing in nearby:
        if existing.latitude and existing.longitude:
            dist = haversine_distance(lat, lon, existing.latitude, existing.longitude)
            if dist <= 50:
                return existing
    return None


@router.post("/report")
async def report_issue(
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(""),
    reporter_name: str = Form("Citizen"),
    reporter_phone: str = Form(""),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    image_bytes = None
    photo_url = None

    if photo:
        ext = photo.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(photo.file, f)
        photo_url = f"/uploads/{filename}"
        image_bytes = open(filepath, "rb").read()

    # Gemini: classify the issue
    classified = classify_issue(description, image_bytes)

    issue_type = classified.get("issue_type", "other")
    severity   = classified.get("severity", "medium")
    title      = classified.get("title", description[:60])
    ward       = classified.get("ward_guess", address or "Unknown")

    # Check for duplicate within 50m
    duplicate = find_duplicate(db, latitude, longitude, issue_type)
    if duplicate:
        duplicate.occurrence_count = (duplicate.occurrence_count or 1) + 1
        db.commit()
        return {
            "merged": True,
            "message": f"This issue already exists nearby (Issue #{duplicate.id}). Merged your report.",
            "existing_issue_id": duplicate.id,
            "occurrence_count": duplicate.occurrence_count
        }

    # Gemini: economic impact
    eco = calculate_economic_impact(issue_type, severity, address or ward)
    daily_loss = eco.get("daily_loss_inr", 0)
    eco_note   = eco.get("explanation", "")

    issue = Issue(
        title=title,
        description=description,
        issue_type=issue_type,
        severity=severity,
        latitude=latitude,
        longitude=longitude,
        address=address,
        ward=ward,
        photo_url=photo_url,
        economic_loss=daily_loss,
        economic_note=eco_note,
        reporter_name=reporter_name,
        reporter_phone=reporter_phone,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)

    return {
        "merged": False,
        "issue_id": issue.id,
        "title": issue.title,
        "issue_type": issue.issue_type,
        "severity": issue.severity,
        "economic_loss_per_day": issue.economic_loss,
        "economic_note": issue.economic_note,
        "message": "Issue reported successfully. NagarAI is now monitoring this."
    }


@router.get("/")
def list_issues(
    status: Optional[str] = None,
    issue_type: Optional[str] = None,
    ward: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Issue).filter(Issue.is_duplicate == False)
    if status:
        q = q.filter(Issue.status == status)
    if issue_type:
        q = q.filter(Issue.issue_type == issue_type)
    if ward:
        q = q.filter(Issue.ward == ward)
    issues = q.order_by(Issue.created_at.desc()).all()

    return [
        {
            "id": i.id,
            "title": i.title,
            "issue_type": i.issue_type,
            "severity": i.severity,
            "status": i.status,
            "latitude": i.latitude,
            "longitude": i.longitude,
            "address": i.address,
            "ward": i.ward,
            "photo_url": i.photo_url,
            "economic_loss": i.economic_loss,
            "economic_note": i.economic_note,
            "reporter_name": i.reporter_name,
            "created_at": i.created_at.isoformat(),
            "days_open": (datetime.utcnow() - i.created_at).days,
            "occurrence_count": i.occurrence_count,
        }
        for i in issues
    ]


@router.get("/{issue_id}")
def get_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return {
        "id": issue.id,
        "title": issue.title,
        "description": issue.description,
        "issue_type": issue.issue_type,
        "severity": issue.severity,
        "status": issue.status,
        "latitude": issue.latitude,
        "longitude": issue.longitude,
        "address": issue.address,
        "ward": issue.ward,
        "photo_url": issue.photo_url,
        "economic_loss": issue.economic_loss,
        "economic_note": issue.economic_note,
        "reporter_name": issue.reporter_name,
        "created_at": issue.created_at.isoformat(),
        "days_open": (datetime.utcnow() - issue.created_at).days,
        "occurrence_count": issue.occurrence_count,
    }


@router.patch("/{issue_id}/resolve")
def resolve_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.status = "resolved"
    issue.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": "Issue marked as resolved", "issue_id": issue_id}


@router.post("/voice")
async def report_via_voice(
    transcript: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    reporter_name: str = Form("Citizen"),
    db: Session = Depends(get_db)
):
    extracted = extract_from_voice(transcript)

    issue_type = extracted.get("issue_type", "other")
    severity   = extracted.get("severity", "medium")
    title      = extracted.get("title", "Voice reported issue")
    description= extracted.get("description", transcript)
    address    = extracted.get("location_hint", "")

    duplicate = find_duplicate(db, latitude, longitude, issue_type)
    if duplicate:
        duplicate.occurrence_count = (duplicate.occurrence_count or 1) + 1
        db.commit()
        return {
            "merged": True,
            "message": f"Already exists as Issue #{duplicate.id}. Merged.",
            "existing_issue_id": duplicate.id
        }

    eco = calculate_economic_impact(issue_type, severity, address or "City")
    issue = Issue(
        title=title,
        description=description,
        issue_type=issue_type,
        severity=severity,
        latitude=latitude,
        longitude=longitude,
        address=address,
        ward=address or "Unknown",
        economic_loss=eco.get("daily_loss_inr", 0),
        economic_note=eco.get("explanation", ""),
        reporter_name=reporter_name,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return {
        "issue_id": issue.id,
        "title": issue.title,
        "issue_type": issue.issue_type,
        "extracted_from": transcript,
        "message": "Voice report processed successfully."
    }


@router.patch("/{issue_id}/unresolve")
def unresolve_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.status = "open"
    issue.resolved_at = None
    db.commit()
    return {"message": "Issue reopened", "issue_id": issue_id}