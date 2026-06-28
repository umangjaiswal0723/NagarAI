from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from database import SessionLocal, Issue, AgentAction
from services.gemini import generate_complaint_email, generate_twitter_thread, generate_rti_content
from services.rti_pdf import generate_rti_pdf
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NagarAI-Scheduler")


def run_agentic_loop():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        open_issues = db.query(Issue).filter(
            Issue.status.in_(["open", "in_progress"]),
            Issue.is_duplicate == False
        ).all()

        for issue in open_issues:
            days_open = (now - issue.created_at).days
            issue_dict = {
                "id": issue.id,
                "title": issue.title,
                "issue_type": issue.issue_type,
                "address": issue.address or "Unknown location",
                "created_at": issue.created_at.strftime("%d %B %Y"),
                "economic_loss": issue.economic_loss or 0,
                "reporter_name": issue.reporter_name or "Citizen",
            }

            # Day 3 → Complaint Email
            if days_open >= 3:
                exists = db.query(AgentAction).filter(
                    AgentAction.issue_id == issue.id,
                    AgentAction.action_type == "complaint_email"
                ).first()
                if not exists:
                    logger.info(f"Generating complaint email for issue #{issue.id}")
                    content = generate_complaint_email(issue_dict)
                    db.add(AgentAction(
                        issue_id=issue.id,
                        action_type="complaint_email",
                        content=content,
                        day_trigger=3
                    ))
                    db.commit()

            # Day 7 → Twitter Thread
            if days_open >= 7:
                exists = db.query(AgentAction).filter(
                    AgentAction.issue_id == issue.id,
                    AgentAction.action_type == "twitter_thread"
                ).first()
                if not exists:
                    logger.info(f"Generating Twitter thread for issue #{issue.id}")
                    content = generate_twitter_thread(issue_dict)
                    db.add(AgentAction(
                        issue_id=issue.id,
                        action_type="twitter_thread",
                        content=content,
                        day_trigger=7
                    ))
                    db.commit()

            # Day 14 → RTI PDF
            if days_open >= 14:
                exists = db.query(AgentAction).filter(
                    AgentAction.issue_id == issue.id,
                    AgentAction.action_type == "rti_pdf"
                ).first()
                if not exists:
                    logger.info(f"Generating RTI PDF for issue #{issue.id}")
                    rti_data = generate_rti_content(issue_dict)
                    pdf_path = generate_rti_pdf(issue_dict, rti_data)
                    db.add(AgentAction(
                        issue_id=issue.id,
                        action_type="rti_pdf",
                        content=pdf_path,
                        day_trigger=14
                    ))
                    db.commit()

            time.sleep(4)

    except Exception as e:
        logger.error(f"Scheduler error: {e}")
    finally:
        db.close()


def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every hour in production; every 10 min for demo
    scheduler.add_job(run_agentic_loop, "interval", minutes=10, id="agentic_loop")
    scheduler.start()
    logger.info("NagarAI Agentic Loop scheduler started")
    # Run once immediately on startup
    run_agentic_loop()
