"""
Run this once to seed demo data for the hackathon presentation.
Usage: python seed_data.py

Seeds 20 issues across 3 Prayagraj wards, some aged 3/7/14 days
so the agentic loop fires immediately on demo day.
"""
from database import engine, Base, SessionLocal, Issue
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

WARDS = ["Civil Lines", "Allahpur", "George Town"]

ISSUES = [
    # Issues aged 14 days (RTI PDF will fire)
    {"title": "Large pothole on MG Road near Civil Lines metro",    "type": "pothole",      "sev": "critical", "ward": "Civil Lines",  "lat": 25.4358, "lng": 81.8463, "days": 14, "eco": 12400, "reporter": "Ravi Kumar"},
    {"title": "Broken streetlight outside DAV school",              "type": "streetlight",  "sev": "high",    "ward": "Allahpur",      "lat": 25.4219, "lng": 81.8551, "days": 14, "eco": 5200,  "reporter": "Priya Singh"},
    # Issues aged 7 days (Twitter thread will fire)
    {"title": "Garbage dump overflowing near Anand Bhavan",        "type": "garbage",      "sev": "high",    "ward": "Civil Lines",   "lat": 25.4367, "lng": 81.8432, "days": 7,  "eco": 8800,  "reporter": "Amit Mishra"},
    {"title": "Waterlogging on Tagore Town bypass road",           "type": "waterlogging", "sev": "high",    "ward": "George Town",   "lat": 25.4502, "lng": 81.8720, "days": 7,  "eco": 15000, "reporter": "Sunita Yadav"},
    {"title": "Broken road surface causing accidents near GPO",    "type": "road_damage",  "sev": "critical","ward": "Civil Lines",   "lat": 25.4396, "lng": 81.8411, "days": 7,  "eco": 9200,  "reporter": "Deepak Verma"},
    # Issues aged 3 days (Complaint email will fire)
    {"title": "Open sewage drain on Leader Road",                  "type": "sewage",       "sev": "high",    "ward": "George Town",   "lat": 25.4488, "lng": 81.8695, "days": 3,  "eco": 6500,  "reporter": "Meena Gupta"},
    {"title": "Pothole cluster near Allahpur market",              "type": "pothole",      "sev": "medium",  "ward": "Allahpur",      "lat": 25.4201, "lng": 81.8530, "days": 3,  "eco": 4800,  "reporter": "Rahul Tiwari"},
    {"title": "Unauthorized encroachment blocking footpath",        "type": "encroachment", "sev": "medium",  "ward": "Civil Lines",   "lat": 25.4341, "lng": 81.8471, "days": 3,  "eco": 2200,  "reporter": "Kavita Joshi"},
    # Fresh issues (no actions yet)
    {"title": "Street dog menace near Muirabad housing colony",    "type": "other",        "sev": "medium",  "ward": "Allahpur",      "lat": 25.4233, "lng": 81.8562, "days": 1,  "eco": 1500,  "reporter": "Anil Sharma"},
    {"title": "Cracked road near High Court gate",                 "type": "road_damage",  "sev": "high",    "ward": "Civil Lines",   "lat": 25.4376, "lng": 81.8398, "days": 1,  "eco": 7800,  "reporter": "Pooja Tripathi"},
    {"title": "Broken footpath near CMP College",                  "type": "road_damage",  "sev": "low",     "ward": "Allahpur",      "lat": 25.4188, "lng": 81.8544, "days": 0,  "eco": 1100,  "reporter": "Vikash Pandey"},
    {"title": "Water pipeline leakage on Thornhill Road",          "type": "sewage",       "sev": "medium",  "ward": "Civil Lines",   "lat": 25.4321, "lng": 81.8455, "days": 0,  "eco": 3400,  "reporter": "Geeta Saxena"},
    {"title": "Overflowing dumpster near railway station",         "type": "garbage",      "sev": "high",    "ward": "George Town",   "lat": 25.4469, "lng": 81.8744, "days": 2,  "eco": 4200,  "reporter": "Suresh Maurya"},
    {"title": "Streetlight out on Hastings Road stretch",          "type": "streetlight",  "sev": "medium",  "ward": "George Town",   "lat": 25.4451, "lng": 81.8712, "days": 5,  "eco": 2800,  "reporter": "Usha Pandey"},
    {"title": "Pothole causing bike accidents on Stanley Road",    "type": "pothole",      "sev": "critical","ward": "George Town",   "lat": 25.4478, "lng": 81.8699, "days": 10, "eco": 11200, "reporter": "Manish Keshari"},
    {"title": "Illegal parking blocking emergency lane",           "type": "encroachment", "sev": "high",    "ward": "Allahpur",      "lat": 25.4215, "lng": 81.8538, "days": 6,  "eco": 3600,  "reporter": "Divya Srivastava"},
    {"title": "Noise pollution from under-construction building",  "type": "noise",        "sev": "low",     "ward": "Civil Lines",   "lat": 25.4349, "lng": 81.8460, "days": 2,  "eco": 900,   "reporter": "Harsh Bajpai"},
    {"title": "Damaged road divider near Motilal Park",            "type": "road_damage",  "sev": "medium",  "ward": "Civil Lines",   "lat": 25.4362, "lng": 81.8445, "days": 8,  "eco": 5100,  "reporter": "Nisha Rai"},
    {"title": "Open manhole cover on Elgin Road",                  "type": "sewage",       "sev": "critical","ward": "George Town",   "lat": 25.4495, "lng": 81.8730, "days": 4,  "eco": 8900,  "reporter": "Ajay Tripathi"},
    {"title": "Waterlogging outside Allahpur bus stop",            "type": "waterlogging", "sev": "medium",  "ward": "Allahpur",      "lat": 25.4207, "lng": 81.8520, "days": 1,  "eco": 3200,  "reporter": "Rekha Mishra"},
]

print("Seeding NagarAI demo data...")
for data in ISSUES:
    eco_notes = {
        "pothole":      f"~{random.randint(300, 600)} vehicles/day face 3-5 min detour = ₹{data['eco']:,}/day economic loss",
        "garbage":      f"Health risk to ~{random.randint(200, 800)} nearby residents = ₹{data['eco']:,}/day loss in productivity",
        "streetlight":  f"Night safety risk for ~{random.randint(100, 400)} pedestrians = ₹{data['eco']:,}/day indirect loss",
        "waterlogging": f"~{random.randint(500, 1200)} vehicles affected, road unusable 4-6 hrs = ₹{data['eco']:,}/day loss",
        "road_damage":  f"~{random.randint(400, 900)} vehicles/day affected with damage risk = ₹{data['eco']:,}/day loss",
        "sewage":       f"Health hazard for ~{random.randint(300, 700)} residents + property value drop = ₹{data['eco']:,}/day",
        "encroachment": f"~{random.randint(200, 600)} pedestrians forced onto road daily = ₹{data['eco']:,}/day risk cost",
        "noise":        f"Affects productivity of ~{random.randint(100, 300)} nearby residents/workers = ₹{data['eco']:,}/day",
        "other":        f"Quality of life impact on ~{random.randint(100, 400)} residents = ₹{data['eco']:,}/day estimated loss",
    }

    issue = Issue(
        title=data["title"],
        description=f"{data['title']}. Reported by citizen via NagarAI.",
        issue_type=data["type"],
        severity=data["sev"],
        status=random.choice(["open", "open", "open", "in_progress"]),
        latitude=data["lat"] + random.uniform(-0.001, 0.001),
        longitude=data["lng"] + random.uniform(-0.001, 0.001),
        address=f"{data['ward']}, Prayagraj, UP",
        ward=data["ward"],
        economic_loss=data["eco"],
        economic_note=eco_notes.get(data["type"], "Economic impact estimated"),
        reporter_name=data["reporter"],
        created_at=datetime.utcnow() - timedelta(days=data["days"]),
    )
    db.add(issue)

db.commit()
count = db.query(Issue).count()
print(f"✓ Seeded {count} issues across {len(WARDS)} wards")
print("✓ Issues aged 14 days: RTI PDF will generate")
print("✓ Issues aged 7 days: Twitter thread will generate")
print("✓ Issues aged 3 days: Complaint email will generate")
print("\nNow run: uvicorn main:app --reload")
db.close()
