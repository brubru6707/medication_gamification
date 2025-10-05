# backend/routers/chat.py
from __future__ import annotations

import os, json, re, time
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..schemas import ChatIn, ChatOut, ChatOutPlus
from ..auth import get_current_user
from ..db import get_db
from ..models import User, Medication

router = APIRouter(prefix="/chat", tags=["chat"])

# =========================
# Utilities & Shared State
# =========================

# Simple AI circuit breaker (prevents spamming Gemini after 429s)
_AI_BACKOFF_UNTIL = 0.0  # epoch seconds

def _now() -> float:
    return time.time()

def _should_try_ai() -> bool:
    if os.getenv("COACH_AI", "hybrid").lower() in {"off", "0", "false", "no"}:
        return False
    return _now() >= _AI_BACKOFF_UNTIL

def _record_ai_backoff(seconds: int = 60) -> None:
    global _AI_BACKOFF_UNTIL
    _AI_BACKOFF_UNTIL = _now() + max(5, seconds)

def _coerce_times(val) -> List[str]:
    if val is None: return []
    if isinstance(val, list): return [str(x) for x in val]
    if isinstance(val, str):
        v = val.strip()
        if not v: return []
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list): return [str(x) for x in parsed]
        except Exception:
            pass
        return [t.strip() for t in v.split(",") if t.strip()]
    return [str(val)]

def _user_meds(db: Session, user: User) -> List[Dict[str, Any]]:
    meds: List[Medication] = (
        db.query(Medication)
        .filter(Medication.user_id == user.id)
        .order_by(Medication.id.asc())
        .all()
    )
    out: List[Dict[str, Any]] = []
    for m in meds:
        out.append({
            "name": (m.name or "").strip(),
            "times": _coerce_times(getattr(m, "times", [])),
        })
    return out

# ===============
# Heuristic Brain
# ===============

def _detect_language(msg: str) -> str:
    s = msg.lower()
    # Arabic script
    if re.search(r"[\u0600-\u06FF]", msg): return "ar"
    # Devanagari (Hindi)
    if re.search(r"[\u0900-\u097F]", msg): return "hi"
    # Spanish hints
    if any(k in s for k in ["¿", " qué", "olvid", "dosis", "hola"]): return "es"
    # French hints
    if any(k in s for k in ["oubli", "dose", "bonjour", "douleur thoracique", "essoufflement"]): return "fr"
    return "en"

def _summarize_today(meds: List[Dict[str, Any]]) -> str:
    if not meds:
        return "I don’t see any meds on your list for today."
    chunks = []
    for m in meds:
        times = m.get("times") or []
        name = m.get("name") or "Medication"
        if times:
            chunks.append(f"{name} at {', '.join(times)}")
        else:
            chunks.append(f"{name} (no times set)")
    return "Today you need to take: " + "; ".join(chunks) + "."

def _missed_dose_reply_en(meds: List[Dict[str, Any]], msg_lc: str) -> str:
    maybe = ""
    for m in meds:
        name = (m.get("name") or "").lower()
        if name and name in msg_lc:
            t = ", ".join(m.get("times") or [])
            maybe = f" For {m.get('name')}{' (' + t + ')' if t else ''}, "
            break
    return (
        "If you missed a dose, it’s usually best to take it when you remember unless it’s "
        "close to the next one—then skip and resume the regular schedule."
        f"{maybe}"
        "Don’t double up unless your prescriber told you to. If you’re unsure, contact your "
        "pharmacist or healthcare provider."
    )

def _missed_dose_reply_es() -> str:
    return (
        "Si olvidaste una dosis, tómala cuando te acuerdes a menos que falte poco para la siguiente; "
        "en ese caso, sáltala y vuelve al horario normal. No dupliques la dosis a menos que tu médico lo indique. "
        "Si tienes dudas, contacta a tu farmacéutico o proveedor/médico."
    )

def _missed_dose_reply_fr() -> str:
    return (
        "Si vous avez oublié une dose, prenez-la lorsque vous vous en souvenez sauf s’il est presque l’heure de la suivante ; "
        "dans ce cas, sautez-la et reprenez l’horaire habituel. Ne doublez pas la dose sauf avis médical. "
        "En cas de doute, contactez votre pharmacien ou votre médecin."
    )

def _missed_dose_reply_ar() -> str:
    return (
        "إذا نسيت جرعة، خذها عندما تتذكر ما لم يكن الوقت قريبًا من الجرعة التالية؛ عندها تجاوَزها وارجع للجدول المعتاد. "
        "لا تضاعف الجرعة إلا إذا أوصى طبيبك بذلك. إذا لم تكن متأكدًا، تواصل مع الصيدلي أو مقدم الرعاية."
    )

def _missed_dose_reply_hi() -> str:
    return (
        "यदि आप कोई खुराक भूल गए हैं, तो याद आते ही लें, जब तक अगली खुराक का समय बहुत नज़दीक न हो—ऐसे में उसे छोड़ें और सामान्य समय पर लौटें। "
        "बिना डॉक्टर की सलाह के डबल डोज़ न लें। संदेह हो तो अपने फार्मासिस्ट/डॉक्टर से संपर्क करें।"
    )

def _emergency_reply_en() -> str:
    return "Chest pain and shortness of breath can be emergencies. Call 911 or go to the nearest emergency department now."

def _emergency_reply_localized(lang: str) -> str:
    if lang == "fr":
        return "Douleur thoracique et essoufflement peuvent être des urgences. Appelez les urgences (112/15) ou rendez-vous aux urgences maintenant."
    if lang == "ar":
        return "ألم الصدر وضيق التنفس قد يكونان حالة طارئة. اتصل بخدمات الطوارئ أو اذهب إلى قسم الطوارئ الآن."
    if lang == "hi":
        return "सीने में दर्द और साँस लेने में तकलीफ़ आपात स्थिति हो सकती है। अपने स्थानीय आपातकालीन नंबर पर कॉल करें या तुरंत इमरजेंसी विभाग जाएँ."
    if lang == "es":
        return "El dolor en el pecho y la falta de aire pueden ser emergencias. Llama a emergencias o acude a urgencias ahora."
    return _emergency_reply_en()

def _side_effects_reply() -> str:
    return (
        "Dizziness and nausea can occur with some medicines. If symptoms are mild, rest and hydrate. "
        "If they’re severe, persistent, or new (e.g., fainting or nonstop vomiting), seek medical care. "
        "When in doubt, contact your pharmacist or provider."
    )

def _interaction_reply() -> str:
    return (
        "Ibuprofen and warfarin can increase bleeding risk. Avoid combining them unless your prescriber says it’s okay. "
        "Please check with your provider or pharmacist before taking ibuprofen."
    )

def _dose_change_reply() -> str:
    return "I cannot adjust prescription doses. Please ask your prescriber or pharmacist for personalized dosing advice."

def _privacy_reply() -> str:
    return "I cannot access private identifiers like a Social Security Number, and I don’t store that information. Please check your personal records."

def _grounding_reply(meds: List[Dict[str, Any]]) -> str:
    if not meds:
        return "I don’t see any meds in your list yet."
    names = ", ".join(m["name"] for m in meds if m.get("name"))
    return f"From your list, I see: {names}."

def _greeting(lang: str) -> str:
    if lang == "es": return "¡Hola! ¿En qué puedo ayudarte con tus medicamentos hoy?"
    if lang == "fr": return "Bonjour ! Comment puis-je vous aider avec vos médicaments aujourd’hui ?"
    if lang == "ar": return "مرحبًا! كيف يمكنني مساعدتك في أدويتك اليوم؟"
    if lang == "hi": return "नमस्ते! मैं आपकी दवाइयों में कैसे मदद कर सकता/सकती हूँ?"
    return "Hello! How can I help with your medications today?"

def _heuristic_reply(message: str, meds: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Return a ChatOutPlus-like dict using fast local rules, multilingual."""
    msg = (message or "").strip()
    msg_lc = msg.lower()
    lang = _detect_language(msg)

    # Emergency (EN + multilingual key phrases)
    emergency_triggers = [
        "chest pain", "shortness of breath", "trouble breathing", "can't breathe", "cant breathe",
        "fainting", "passed out", "anaphylaxis", "swelling of face", "lips swelling",
        "stroke", "slurred speech", "one side weak", "overdose", "took too many",
    ]
    if any(k in msg_lc for k in emergency_triggers) \
       or ("should i call 911" in msg_lc) or ("call 911" in msg_lc and "?" in msg_lc):
        return {
            "reply": _emergency_reply_localized(lang),
            "intent": "other",
            "risk_level": "red",
            "language": lang,
            "actions": ["CALL_911"],
        }
    # FR emergency hints
    if "douleur thoracique" in msg_lc or "essoufflement" in msg_lc:
        return {
            "reply": _emergency_reply_localized("fr"),
            "intent": "other",
            "risk_level": "red",
            "language": "fr",
            "actions": ["CALL_911"],
        }
    # ES emergency hints
    if "dolor de pecho" in msg_lc or "falta de aire" in msg_lc:
        return {
            "reply": _emergency_reply_localized("es"),
            "intent": "other",
            "risk_level": "red",
            "language": "es",
            "actions": ["CALL_911"],
        }
    # AR emergency hints
    if "ألم صدر" in msg or "الم صدر" in msg or "ضيق نفس" in msg:
        return {
            "reply": _emergency_reply_localized("ar"),
            "intent": "other",
            "risk_level": "red",
            "language": "ar",
            "actions": ["CALL_911"],
        }
    # HI emergency hints
    if "सीने में दर्द" in msg or "साँस" in msg or "सांस" in msg:
        return {
            "reply": _emergency_reply_localized("hi"),
            "intent": "other",
            "risk_level": "red",
            "language": "hi",
            "actions": ["CALL_911"],
        }

    # Greetings
    if any(w in msg_lc.split() for w in ["hi", "hello", "hey"]) or any(k in msg_lc for k in ["hola", "bonjour", "مرحب", "नमस्ते"]):
        return {"reply": _greeting(lang), "intent": "hello", "risk_level": "green", "language": lang, "actions": []}

    # Summarize today
    if "summarize" in msg_lc or ("today" in msg_lc and "dose" in msg_lc) or "schedule" in msg_lc:
        return {"reply": _summarize_today(meds), "intent": "summary", "risk_level": "green", "language": "en", "actions": []}

    # Missed dose (EN + multilingual keywords)
    if any(k in msg_lc for k in ["missed", "late", "forgot", "forget"]) or \
       any(k in msg_lc for k in ["olvid", "dosis"]) or \
       any(k in msg_lc for k in ["oubli"]) or \
       ("نسيت" in msg or "جرعة" in msg) or \
       ("भूल" in msg or "खुराक" in msg):
        if "es" == lang:
            rep = _missed_dose_reply_es()
        elif "fr" == lang:
            rep = _missed_dose_reply_fr()
        elif "ar" == lang:
            rep = _missed_dose_reply_ar()
        elif "hi" == lang:
            rep = _missed_dose_reply_hi()
        else:
            rep = _missed_dose_reply_en(meds, msg_lc)
        return {"reply": rep, "intent": "missed_dose", "risk_level": "green", "language": lang, "actions": []}

    # Side effects
    if any(w in msg_lc for w in ["dizzy", "nausea", "nauseous", "lightheaded", "light-headed"]):
        return {"reply": _side_effects_reply(), "intent": "side_effects", "risk_level": "green", "language": "en", "actions": []}

    # Interaction
    if ("ibuprofen" in msg_lc and "warfarin" in msg_lc) or "interaction" in msg_lc:
        return {"reply": _interaction_reply(), "intent": "interaction", "risk_level": "yellow", "language": "en", "actions": []}

    # Dose change / double
    if any(w in msg_lc for w in ["double", "increase", "change"]) and any(d in msg_lc for d in ["dose", "dosage"]):
        return {"reply": _dose_change_reply(), "intent": "dose_change", "risk_level": "green", "language": "en", "actions": []}

    # Privacy
    if any(w in msg_lc for w in ["ssn", "social security", "social-security", "national id"]):
        return {"reply": _privacy_reply(), "intent": "privacy", "risk_level": "green", "language": "en", "actions": []}

    # Grounding
    if "what meds" in msg_lc or ("what" in msg_lc and "am i taking" in msg_lc) or "list my medications" in msg_lc:
        return {"reply": _grounding_reply(meds), "intent": "what_meds", "risk_level": "green", "language": "en", "actions": []}

    # Fallback
    return {
        "reply": ("I’m here to help with medication questions. You can ask me to summarize today’s doses, "
                  "discuss missed doses, side effects, interactions, or general safety tips. For dosing changes, "
                  "please contact your provider."),
        "intent": "other",
        "risk_level": "green",
        "language": "en",
        "actions": [],
    }

# ======================
# Gemini JSON extraction
# ======================

_JSON_BLOCK = re.compile(r"\{.*\}", flags=re.S)
_FENCE = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", flags=re.S)

def _extract_json(s: str) -> Optional[dict]:
    if not s: return None
    m = _FENCE.search(s)
    if m:
        try: return json.loads(m.group(1))
        except Exception: pass
    m2 = _JSON_BLOCK.search(s)
    if m2:
        try: return json.loads(m2.group(0))
        except Exception: pass
    return None

def _require_gemini():
    try:
        import google.generativeai as genai  # type: ignore
    except Exception as e:
        return None, None, f"google-generativeai not installed: {e}"
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None, None, "GOOGLE_API_KEY missing in backend/.env"
    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    return genai, model_name, None

def _gemini_json_reply(user: User, meds: List[Dict[str,Any]], message: str) -> Optional[Dict[str, Any]]:
    """Return dict or None; NEVER raise—fallback handled by caller. Applies rate-limit backoff."""
    if not _should_try_ai():
        return None

    genai, model_name, err = _require_gemini()
    if err or genai is None:
        return None

    model = genai.GenerativeModel(model_name)

    meds_lines = "\n".join(
        f"- {m['name']}: {', '.join(m['times'])}" if m.get("times") else f"- {m.get('name')}"
        for m in meds if m.get("name")
    ) or "(none)"

    system = f"""
ROLE: Medication-support assistant (not a clinician).
SCOPE: Medication safety, side effects, interactions, adherence tips. Stay strictly in the medical/medication domain.
SAFETY:
- Do NOT diagnose, prescribe, or change doses.
- For immediate life-threatening symptoms (e.g., chest pain, shortness of breath, stroke signs, anaphylaxis, overdose):
  set risk_level="red", include "CALL_911" in actions, reply must urge the user to call 911 or go to ER now.
- For risky but not emergent concerns (e.g., bleeding on warfarin, severe side effects), set risk_level="yellow" and
  advise contacting a healthcare provider/pharmacist promptly.
- Otherwise use risk_level="green".
PRIVACY:
- Never request or use private identifiers (SSN etc.). If asked, refuse and state you do not have that data.
MULTILINGUAL:
- Detect and reply in one of: en, es, fr, ar, hi. If unknown, default to English ("en").
PERSONALIZATION:
- Ground lightly in the user's med list if relevant. Do NOT invent meds or dosing.
STYLE:
- 1–4 sentences. Clear, empathetic, concise.
OUTPUT:
Return ONLY a single JSON object:

{{
  "reply": "string",
  "intent": "hello|summary|missed_dose|side_effects|interaction|dose_change|privacy|what_meds|other",
  "risk_level": "green|yellow|red",
  "language": "en|es|fr|ar|hi",
  "actions": []
}}

UserName: {getattr(user, "name", "User")}
MedList:
{meds_lines}
""".strip()

    user_msg = f"User message:\n{message}\n\nRespond per OUTPUT exactly."

    try:
        resp = model.generate_content(system + "\n\n" + user_msg)
        text = getattr(resp, "text", None)
        if not text and getattr(resp, "candidates", None):
            text = resp.candidates[0].content.parts[0].text
        data = _extract_json(text or "")
        if not isinstance(data, dict):
            return None

        # Sanitize fields
        data.setdefault("reply", "Sorry, I couldn’t generate a reply.")
        data.setdefault("intent", "other")
        data.setdefault("risk_level", "green")
        data.setdefault("language", "en")
        data.setdefault("actions", [])
        if data["risk_level"] not in {"green","yellow","red"}: data["risk_level"] = "green"
        if data["language"] not in {"en","es","fr","ar","hi"}: data["language"] = "en"
        if not isinstance(data["actions"], list): data["actions"] = []
        return data
    except Exception as e:
        # Rate limits or quota -> back off; swallow error
        if "429" in str(e) or "quota" in str(e).lower():
            _record_ai_backoff(60)
        return None

# =========
# Endpoints
# =========

@router.post("", response_model=ChatOut)
def chat(payload: ChatIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChatOut:
    meds = _user_meds(db, user)

    # 1) Heuristics first (fast, robust)
    h = _heuristic_reply(payload.message, meds)
    # If heuristic clearly matched something (intent != other or red risk), return it
    if h["intent"] != "other" or h["risk_level"] == "red":
        return ChatOut(reply=(h.get("reply") or "").strip() or "Sorry, I couldn’t generate a reply.")

    # 2) Try Gemini (optional enrichment)
    ai = _gemini_json_reply(user, meds, payload.message)
    if ai and isinstance(ai, dict) and ai.get("reply"):
        return ChatOut(reply=(ai.get("reply") or "").strip() or "Sorry, I couldn’t generate a reply.")

    # 3) Fallback to heuristic text
    return ChatOut(reply=(h.get("reply") or "").strip() or "Sorry, I couldn’t generate a reply.")

@router.post("/plus", response_model=ChatOutPlus)
def chat_plus(payload: ChatIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChatOutPlus:
    meds = _user_meds(db, user)

    # Heuristic baseline
    h = _heuristic_reply(payload.message, meds)

    # If emergency or a clear intent, return heuristics (used_ai False) unless we prefer AI polish
    if h["risk_level"] == "red" or h["intent"] != "other":
        return ChatOutPlus(
            reply=h["reply"], intent=h["intent"], risk_level=h["risk_level"],
            language=h["language"], actions=h["actions"], used_ai=False
        )

    # Otherwise try Gemini
    ai = _gemini_json_reply(user, meds, payload.message)
    if ai:
        return ChatOutPlus(
            reply=ai.get("reply", h["reply"]),
            intent=ai.get("intent", h["intent"]),
            risk_level=ai.get("risk_level", h["risk_level"]),
            language=ai.get("language", h["language"]),
            actions=ai.get("actions", h["actions"]),
            used_ai=True
        )

    # Final fallback: heuristics
    return ChatOutPlus(
        reply=h["reply"], intent=h["intent"], risk_level=h["risk_level"],
        language=h["language"], actions=h["actions"], used_ai=False
    )
