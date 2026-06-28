from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from collections import defaultdict

from database import get_db, Issue, AgentAction

router = APIRouter()


def calculate_ward_score(total, resolved, avg_days) -> int:
    """Score 0-100: resolution rate (60%) + speed bonus (40%)."""
    if total == 0:
        return 100
    rate_score  = (resolved / total) * 60
    speed_score = max(0, 40 - (avg_days * 2)) if avg_days else 40
    return min(100, int(rate_score + speed_score))


@router.get("/city-health")
def city_health(db: Session = Depends(get_db)):
    """Overall city health score and ward leaderboard."""
    issues = db.query(Issue).filter(Issue.is_duplicate == False).all()

    if not issues:
        return {
            "city_score": 100,
            "total_issues": 0,
            "resolved": 0,
            "open": 0,
            "total_economic_loss_per_day": 0,
            "wards": [],
            "issue_type_breakdown": {}
        }

    ward_data = defaultdict(lambda: {"total": 0, "resolved": 0, "days": [], "types": []})

    for i in issues:
        w = i.ward or "Unknown"
        ward_data[w]["total"] += 1
        ward_data[w]["types"].append(i.issue_type)
        if i.status == "resolved" and i.resolved_at:
            ward_data[w]["resolved"] += 1
            days = (i.resolved_at - i.created_at).days
            ward_data[w]["days"].append(days)

    wards = []
    for ward, d in ward_data.items():
        avg_days = sum(d["days"]) / len(d["days"]) if d["days"] else 0
        score = calculate_ward_score(d["total"], d["resolved"], avg_days)
        top_issue = max(set(d["types"]), key=d["types"].count) if d["types"] else "other"
        wards.append({
            "ward": ward,
            "score": score,
            "total_issues": d["total"],
            "resolved": d["resolved"],
            "open": d["total"] - d["resolved"],
            "resolution_rate": round((d["resolved"] / d["total"]) * 100, 1),
            "avg_resolution_days": round(avg_days, 1),
            "top_issue": top_issue,
        })

    wards.sort(key=lambda x: x["score"], reverse=True)
    city_score = int(sum(w["score"] for w in wards) / len(wards)) if wards else 100

    total_open     = sum(1 for i in issues if i.status != "resolved")
    total_resolved = sum(1 for i in issues if i.status == "resolved")
    eco_loss       = sum(i.economic_loss for i in issues if i.status != "resolved" and i.economic_loss)

    types = [i.issue_type for i in issues]
    type_breakdown = {t: types.count(t) for t in set(types)}

    return {
        "city_score": city_score,
        "total_issues": len(issues),
        "resolved": total_resolved,
        "open": total_open,
        "total_economic_loss_per_day": round(eco_loss, 2),
        "wards": wards,
        "issue_type_breakdown": type_breakdown,
    }


@router.get("/heatmap")
def heatmap_data(db: Session = Depends(get_db)):
    """All issue GPS points with weight for heatmap layer."""
    issues = db.query(Issue).filter(
        Issue.latitude != None,
        Issue.longitude != None,
        Issue.is_duplicate == False
    ).all()

    severity_weight = {"low": 1, "medium": 2, "high": 3, "critical": 4}

    return [
        {
            "lat": i.latitude,
            "lng": i.longitude,
            "weight": severity_weight.get(i.severity, 1),
            "issue_type": i.issue_type,
            "title": i.title,
        }
        for i in issues
    ]


@router.get("/stats")
def overall_stats(db: Session = Depends(get_db)):
    """Quick stats for the top of the dashboard."""
    total    = db.query(Issue).filter(Issue.is_duplicate == False).count()
    resolved = db.query(Issue).filter(Issue.status == "resolved").count()
    open_issues = db.query(Issue).filter(Issue.status == "open").count()
    actions  = db.query(AgentAction).count()
    eco_loss = db.query(func.sum(Issue.economic_loss)).filter(
        Issue.status != "resolved"
    ).scalar() or 0

    return {
        "total_issues": total,
        "resolved": resolved,
        "open": open_issues,
        "agentic_actions_taken": actions,
        "daily_economic_loss_inr": round(eco_loss, 2),
    }
