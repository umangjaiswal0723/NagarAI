# NagarAI 🏙️ — The City's Autonomous Nervous System

## Setup in 5 minutes

### 1. Backend

```bash
cd nagarai/backend

# Install Python deps
pip install -r requirements.txt

# Add your Gemini API key
# Edit .env → paste your key from aistudio.google.com

# Seed demo data (20 issues, some aged 3/7/14 days)
python seed_data.py

# Start server
uvicorn main:app --reload
# Runs on http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd nagarai/frontend

# Add your Google Maps key
# Edit .env → paste your key from console.cloud.google.com

# Install and run
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Demo Script (Hackathon Day)

1. Open http://localhost:5173
2. Show **Dashboard** — City Health Score, ward leaderboard, charts
3. Open **Live Map** — heatmap of all issues with economic weights
4. Click any issue aged **14 days** → Show RTI PDF auto-generated
5. Click **Simulate Day 14** on a fresh issue → watch all 3 actions fire live
6. Click **Download PDF** → show judges a real RTI application ready to file
7. Go to **Report** → hold mic, speak in Hindi → AI extracts and files the report

**Money line**: "NagarAI didn't just log this complaint. It fought for the citizen."

---

## Project Structure

```
nagarai/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # SQLite models
│   ├── requirements.txt
│   ├── seed_data.py         # Demo data seeder
│   ├── .env                 # GEMINI_API_KEY
│   ├── routes/
│   │   ├── issues.py        # Report, list, voice, deduplicate
│   │   ├── actions.py       # Agentic loop outputs + demo trigger
│   │   └── dashboard.py     # City health, heatmap, stats
│   └── services/
│       ├── gemini.py        # All Gemini AI calls
│       ├── scheduler.py     # APScheduler agentic loop
│       └── rti_pdf.py       # RTI PDF generator
│
└── frontend/
    ├── src/
    │   ├── App.jsx           # Router + sidebar
    │   ├── api.js            # All API calls
    │   ├── pages/
    │   │   ├── Dashboard.jsx  # City health + ward leaderboard
    │   │   ├── MapView.jsx    # Google Maps heatmap
    │   │   ├── Report.jsx     # Photo + voice reporting
    │   │   ├── IssuesList.jsx # Filterable issues list
    │   │   └── IssueDetail.jsx # Agentic loop actions + RTI
    │   └── index.css
    └── .env                  # VITE_MAPS_API_KEY

```

---

## Key Features

| Feature | How it works |
|---|---|
| **Civic Agentic Loop** | APScheduler checks issues hourly; Day 3→email, Day 7→Twitter thread, Day 14→RTI PDF |
| **Gemini Vision** | Classifies issue type + severity from uploaded photo |
| **Economic Impact Score** | Gemini calculates ₹ loss/day with vehicle/resident estimates |
| **Voice Reporting** | Web Speech API → Gemini extracts Hindi/English/Hinglish report |
| **GPS Deduplication** | New report within 50m of same type = merged, not duplicated |
| **City Health Score** | 0-100 per ward based on resolution rate + speed |
| **RTI PDF** | reportlab generates a legally formatted RTI application |

---

## Deployment (Day 7)

**Backend → Render**
- New Web Service → connect GitHub repo
- Root dir: `nagarai/backend`
- Build cmd: `pip install -r requirements.txt`
- Start cmd: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add env var: `GEMINI_API_KEY`

**Frontend → Vercel**
- Import GitHub repo
- Root dir: `nagarai/frontend`
- Add env var: `VITE_MAPS_API_KEY`, `VITE_API_URL` (your Render URL)
