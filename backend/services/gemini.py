from google import genai
from groq import Groq
import os
import base64
import json
from dotenv import load_dotenv

load_dotenv()

# Primary: Gemini
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options={"api_version": "v1alpha"}
)
GEMINI_MODEL = "gemini-2.0-flash"

# Fallback: Groq
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.3-70b-versatile"


def _ask(prompt: str) -> str:
    """Try Gemini first, fall back to Groq on ANY error (quota, auth, etc)."""
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini failed, falling back to Groq] {e}")
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024
        )
        return response.choices[0].message.content.strip()


def _ask_json(prompt: str) -> dict:
    """Try Gemini first, fall back to Groq on ANY error (quota, auth, etc)."""
    full_prompt = prompt + "\n\nRespond ONLY with valid JSON, no markdown, no explanation."
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=full_prompt
        )
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"[Gemini failed, falling back to Groq] {e}")
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": full_prompt}],
            max_tokens=1024
        )
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)


def classify_issue(description: str, image_bytes: bytes | None = None) -> dict:
    prompt = f"""
You are an AI civic assistant for Indian cities. Analyze this civic complaint.
Description: {description}
Return JSON with:
- issue_type: one of [pothole, garbage, streetlight, waterlogging, road_damage, encroachment, sewage, noise, other]
- severity: one of [low, medium, high, critical]
- title: short 5-8 word title
- ward_guess: location/ward name or "Unknown"
Return ONLY valid JSON.
"""
    if image_bytes:
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[prompt, {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(image_bytes).decode()}}]
            )
            text = response.text.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            print(f"[Gemini vision failed, falling back to Groq text-only] {e}")
            return _ask_json(prompt)
    else:
        return _ask_json(prompt)


def calculate_economic_impact(issue_type: str, severity: str, address: str) -> dict:
    prompt = f"""
Calculate daily economic impact of this civic issue in Indian Rupees.
Issue type: {issue_type}, Severity: {severity}, Location: {address}
Return JSON with:
- daily_loss_inr: integer
- explanation: one sentence with specific numbers like "~400 vehicles/day face 3-min detour = Rs.12,400 loss/day"
- impact_category: one of [traffic, health, business, infrastructure, environment]
"""
    return _ask_json(prompt)


def generate_complaint_email(issue: dict) -> str:
    prompt = f"""
Write a formal complaint email to Ward Councillor about unresolved civic issue in India.
Title: {issue['title']}
Type: {issue['issue_type']}
Location: {issue['address']}
Date Reported: {issue['created_at']}
Economic loss: Rs.{issue['economic_loss']}/day
Reporter: {issue['reporter_name']}

Requirements:
- Formal and firm tone
- Mention open for 3 days with no action
- Quote the economic impact
- Request resolution within 7 days
- Mention RTI Act 2005 as next step
- Full email with Subject line
"""
    return _ask(prompt)


def generate_twitter_thread(issue: dict) -> str:
    prompt = f"""
Write a 5-tweet Twitter/X thread about unresolved civic issue in India.
Title: {issue['title']}
Location: {issue['address']}
Open for: 7 days
Economic loss: Rs.{issue['economic_loss']}/day
Total loss: Rs.{issue['economic_loss'] * 7:,.0f}

Format exactly:
1/ [tweet]
2/ [tweet]
3/ [tweet]
4/ [tweet]
5/ [tweet with hashtags #NagarAI #Prayagraj #JanSuvidha #RTI]

Each tweet under 280 characters.
"""
    return _ask(prompt)


def generate_rti_content(issue: dict) -> dict:
    prompt = f"""
Generate RTI application content under RTI Act 2005 for unresolved civic issue in India.
Title: {issue['title']}
Type: {issue['issue_type']}
Location: {issue['address']}
Open for: 14 days
Daily loss: Rs.{issue['economic_loss']}
Reporter: {issue['reporter_name']}

Return JSON with:
- subject: RTI application subject line
- authority: correct government authority name
- body: full RTI application text with 5 numbered questions
- fee_note: note about Rs.10 RTI fee
"""
    return _ask_json(prompt)


def extract_from_voice(transcript: str) -> dict:
    prompt = f"""
Extract civic issue details from voice transcript (may be Hindi/English/Hinglish):
"{transcript}"

Return JSON with:
- issue_type: one of [pothole, garbage, streetlight, waterlogging, road_damage, encroachment, sewage, noise, other]
- severity: one of [low, medium, high, critical]
- description: clean English description
- location_hint: any location mentioned
- title: short 5-8 word title
"""
    return _ask_json(prompt)


def generate_ward_summary(ward: str, stats: dict) -> str:
    prompt = f"""
Write a 2-sentence civic health summary for ward "{ward}".
Total issues: {stats['total']}, Resolved: {stats['resolved']},
Resolution rate: {stats['resolution_rate']}%, Top issue: {stats['top_issue']}
Keep it factual and under 50 words.
"""
    return _ask(prompt)