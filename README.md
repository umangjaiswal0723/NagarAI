# NagarAI 🏙️ — The City's Autonomous Nervous System

> An AI agent that doesn't just log civic complaints — it autonomously fights for citizens until the issue is resolved.

### 🔗 Live Links

| | |
|---|---|
| 🌐 **Live App** | [nagar-ai-eight.vercel.app](https://nagar-ai-eight.vercel.app) |

---

## The Problem

When a citizen reports a pothole, broken streetlight, or garbage dump in an Indian city, it typically disappears into a void. No follow-up, no accountability, no resolution. Most civic apps just log the complaint and stop there.

## The Solution

**NagarAI doesn't stop at logging.** After an issue is reported, an autonomous AI agent monitors it silently and escalates automatically:

- **Day 3, unresolved** → AI drafts a formal complaint email to the Ward Councillor
- **Day 7, unresolved** → AI generates a ready-to-post Twitter/X thread to apply public pressure
- **Day 14, unresolved** → AI auto-fills a legally formatted **RTI application** under the RTI Act, 2005 — a real document the citizen can download and file

This runs entirely in the background, with zero human intervention required, via an autonomous scheduler that checks every open issue and triggers the correct action based on how long it's been unresolved.

---

## 🎬 Demo Script

1. Open the [live app](https://nagar-ai-eight.vercel.app)
2. **Dashboard** — City Health Score, ward leaderboard, charts
3. **Live Map** — heatmap of all issues with economic weights
4. Click any issue aged 14 days → see the RTI PDF auto-generated, no clicks needed
5. Click **Download PDF** → a real RTI application ready to file
6. **Report** page → hold the mic, speak in Hindi → AI extracts and files the report

**Money line:** *"NagarAI didn't just log this complaint. It fought for the citizen."*

---

## ✨ Key Features

| Feature | How it works |
|---|---|
| **Civic Agentic Loop** | APScheduler checks issues continuously; Day 3 → email, Day 7 → Twitter thread, Day 14 → RTI PDF |
| **Gemini Vision** | Classifies issue type + severity from an uploaded photo |
| **Economic Impact Score** | Gemini calculates ₹ loss/day with vehicle/resident estimates |
| **Voice Reporting** | Web Speech API → Gemini extracts Hindi/English/Hinglish reports |
| **GPS Deduplication** | A new report within 50m of the same issue type is merged, not duplicated |
| **City Health Score** | 0–100 per ward, based on resolution rate + speed |
| **RTI PDF** | ReportLab generates a legally formatted RTI application |
| **AI Fallback** | Gemini 2.0 Flash primary, Groq Llama 3.3 70B automatic fallback for high availability |

---

## 🏗️ Tech Stack

**Backend:** FastAPI · SQLAlchemy · SQLite · APScheduler · ReportLab
**AI:** Google Gemini 2.0 Flash · Groq Llama 3.3 70B (fallback)
**Frontend:** React · Vite · Tailwind CSS · Recharts
**Maps:** Google Maps JavaScript API
**Deployment:** Render (backend) · Vercel (frontend)

---

## 🚀 Run It Locally

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# Add your keys to .env
# GEMINI_API_KEY=your_key_from_aistudio.google.com
# GROQ_API_KEY=your_key_from_console.groq.com

python seed_data.py        # Seeds 20 demo issues
uvicorn main:app --reload  # Runs on http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
# Add your Google Maps key to .env
npm install
npm run dev   # Runs on http://localhost:5173
```

---

## 📁 Project Structure

```
NagarAI/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # SQLite models
│   ├── seed_data.py         # Demo data seeder
│   ├── routes/
│   │   ├── issues.py        # Report, list, voice, deduplicate
│   │   ├── actions.py       # Agentic loop outputs + demo trigger
│   │   └── dashboard.py     # City health, heatmap, stats
│   └── services/
│       ├── gemini.py        # All AI calls (Gemini + Groq fallback)
│       ├── scheduler.py     # APScheduler agentic loop
│       └── rti_pdf.py       # RTI PDF generator
│
└── frontend/
    └── src/
        ├── App.jsx           # Router + sidebar
        ├── api.js            # All API calls
        └── pages/
            ├── Dashboard.jsx   # City health + ward leaderboard
            ├── MapView.jsx     # Google Maps heatmap
            ├── Report.jsx      # Photo + voice reporting
            ├── IssuesList.jsx  # Filterable issues list
            └── IssueDetail.jsx # Agentic loop actions + RTI
```

---

## Built By

**Umang Jaiswal** 