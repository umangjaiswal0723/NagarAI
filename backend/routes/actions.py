from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db, AgentAction, Issue
from services.scheduler import run_agentic_loop

router = APIRouter()


@router.get("/issue/{issue_id}")
def get_actions_for_issue(issue_id: int, db: Session = Depends(get_db)):
    """Get all agentic actions generated for a specific issue."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    actions = db.query(AgentAction).filter(
        AgentAction.issue_id == issue_id
    ).order_by(AgentAction.triggered_at).all()

    days_open = (datetime.utcnow() - issue.created_at).days

    return {
        "issue_id": issue_id,
        "issue_title": issue.title,
        "days_open": days_open,
        "actions": [
            {
                "id": a.id,
                "type": a.action_type,
                "day_trigger": a.day_trigger,
                "content": a.content if a.action_type != "rti_pdf" else None,
                "pdf_available": a.action_type == "rti_pdf",
                "triggered_at": a.triggered_at.isoformat(),
            }
            for a in actions
        ],
        "pending": {
            "complaint_email": days_open >= 3 and not any(a.action_type == "complaint_email" for a in actions),
            "twitter_thread":  days_open >= 7 and not any(a.action_type == "twitter_thread"  for a in actions),
            "rti_pdf":         days_open >= 14 and not any(a.action_type == "rti_pdf"         for a in actions),
        },
        "next_action": (
            f"Complaint email in {3 - days_open} days"  if days_open < 3  else
            f"Twitter thread in {7 - days_open} days"   if days_open < 7  else
            f"RTI PDF in {14 - days_open} days"         if days_open < 14 else
            "All actions triggered"
        )
    }


@router.get("/rti/{action_id}/download")
def download_rti_pdf(action_id: int, db: Session = Depends(get_db)):
    """Download the RTI PDF for an action."""
    action = db.query(AgentAction).filter(
        AgentAction.id == action_id,
        AgentAction.action_type == "rti_pdf"
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="RTI PDF not found")
    if not action.content or not __import__("os").path.exists(action.content):
        raise HTTPException(status_code=404, detail="PDF file not found on server")
    return FileResponse(
        action.content,
        media_type="application/pdf",
        filename=f"RTI_Application_Issue_{action.issue_id}.pdf"
    )


@router.post("/demo/trigger/{issue_id}")
def demo_trigger(issue_id: int, simulate_days: int = 14, db: Session = Depends(get_db)):
    """
    DEMO MODE: Simulate an issue being X days old and trigger the agentic loop.
    Use this for hackathon presentation — set simulate_days to 3, 7, or 14.
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Backdate the issue creation time for demo
    issue.created_at = datetime.utcnow() - timedelta(days=simulate_days)
    db.commit()

    # Run the loop immediately
    run_agentic_loop()

    return {
        "message": f"Demo triggered: Issue #{issue_id} simulated as {simulate_days} days old. Agentic loop ran.",
        "check_actions": f"/api/actions/issue/{issue_id}"
    }


@router.get("/all")
def get_all_actions(db: Session = Depends(get_db)):
    """Get all agentic actions across all issues."""
    actions = db.query(AgentAction).order_by(AgentAction.triggered_at.desc()).limit(50).all()
    return [
        {
            "id": a.id,
            "issue_id": a.issue_id,
            "type": a.action_type,
            "day_trigger": a.day_trigger,
            "triggered_at": a.triggered_at.isoformat(),
        }
        for a in actions
    ]
