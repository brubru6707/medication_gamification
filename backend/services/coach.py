# backend/services/coach.py
from __future__ import annotations

import os, json, time
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from ..models import Medication, User

# ---- AI circuit breaker (prevents repeated 429s) ----
_AI_BACKOFF_UNTIL = 0.0  # epoch seconds

def _now() -> float:
    return time.time()

def _should_try_ai() -> bool:
    if os.getenv("COACH_AI", "hybrid").lower() in {"off", "0", "false", "no"}:
        return False
    return _now() >= _AI_BACKOFF_UNTIL

def _record_ai_backoff(seconds: int = 60):
    global _AI_BACKOFF_UNTIL
    _AI_BACKOFF_UNTIL = _now() + max(5, seconds)

# ---- Helpers to coerce times and pull meds ----
def _coerce_times(val) -> List[str]:
    if val is None:
        return []
    if isinstance(val, list):
        return [str(x) for x in val]
    if isinstance(val, str):
        s = val.strip()
        if not s:
            return []
        try:
            parsed = json.loads(s)
            if isinstance(parsed, list):
                return [str(x) for x in parsed]
        except Exception:
            pass
        return [t.strip() for t in s.split(",") if t.strip()]
    return [str(val)]

def _list_user_meds(db: Session, user: User) -> List[Dict[str, str]]:
    meds: List = (
        db.query(type(db).registry._class_registry["Medication"])  # type: ignore
        .filter_by(user_id=user.id)
        .order_by(type(db).registry._class_registry["Medication"].id.asc())  # type: ignore
        .all()
    )
    out: List[Dict[str, str]] = []
    for m in meds:
        name = (getattr(m, "name", "") or "").strip()
        times = _coerce_times(getattr(m, "times", []))
        out.append({"name": name, "name_lc": name.lower(), "times": times})
    return out

# ---- English replies ----
def _summarize_today(meds: List[Dict[str, str]]) -> str:
    if not meds:
        return "I don’t see any meds on your list for today."
    chunks = []
    for m in meds:
        if m["times"]:
            chunks.append(f"{m['name']} at {', '.join(m['times'])}")
        else:
            chunks.append(f"{m['name']} (no times set)")
    return "Today you need to take: " + "; ".join(chunks) + "."

def _missed_dose_reply(meds: List[Dict[str, str]], msg_lc: str) -> str:
    maybe = ""
    for m in meds:
        if m["name_lc"] and m["name_lc"] in msg_lc:
            t = ", ".join(m["times"]) if m["times"] else ""
            maybe = f" For {m['name']}{' (' + t + ')' if t else ''}, "
            break
    return (
        "If you missed a dose, it’s usually best to take it when you remember unless it’s "
        "close to the next one—then skip and resume the regular schedule."
        f"{maybe}"
        "Don’t double up unless your prescriber told you to. If you’re unsure, contact your "
        "pharmacist or healthcare provider."
    )

def _side_effects_reply() -> str:
    return (
        "Dizziness and nausea can occur with some medicines. If symptoms are mild, rest and hydrate. "
        "If they’re severe, persistent, or you develop new concerning symptoms (e.g., fainting or nonstop vomiting), "
        "seek medical care. When in doubt, contact your pharmacist or provider."
    )

def _emergency_reply() -> str:
    return (
        "Chest pain and shortness of breath can be emergencies. Call 911 or go to the nearest emergency department now."
    )

def _interaction_reply() -> str:
    return (
        "Ibuprofen and warfarin can increase bleeding risk. Avoid combining them unless your prescriber says it’s okay. "
        "Please check with your provider or pharmacist before taking ibuprofen."
    )

def _dose_change_reply() -> str:
    return (
        "I cannot adjust prescription doses. Please ask your prescriber or pharmacist for personalized dosing advice."
    )

def _privacy_reply() -> str:
    return (
        "I cannot access private identifiers like a Social Security Number, and I don’t store that information. "
        "Please check your personal records."
    )

def _grounding_reply(meds: List[Dict[str, str]]) -> str:
    if not meds:
        return "I don’t see any meds in your list yet."
    names = ", ".join(m["name"] for m in meds if m["name"])
    return f"From your list, I see: {names}."

# ---- Multilingual short replies ----
def _spanish_missed_dose() -> str:
    return (
        "Si olvidaste una dosis, tómala cuando te acuerdes a menos que falte poco para la siguiente; "
        "en ese caso, sáltala y vuelve al horario normal. No dupliques la dosis a menos que tu médico lo indique. "
        "Si tienes dudas, contacta a tu farmacéutico o proveedor/médico."
    )

def _french_missed_dose() -> str:
    return (
        "Si vous avez oublié une dose, prenez-la lorsque vous vous en souvenez sauf s’il est presque l’heure de la suivante ; "
        "dans ce cas, sautez-la et reprenez l’horaire habituel. Ne doublez pas la dose sauf avis médical. "
        "En cas de doute, contactez votre pharmacien ou votre médecin."
    )

def _arabic_missed_dose() -> str:
    return (
        "إذا نسيت جرعة، خذها عندما تتذكر ما لم يكن الوقت قريبًا من الجرعة التالية؛ عندها تجاوَزها وارجع للجدول المعتاد. "
        "لا تضاعف الجرعة إلا إذا أوصى طبيبك بذلك. إذا لم تكن متأكدًا، تواصل مع الصيدلي أو مقدم الرعاية."
    )

def _hindi_missed_dose() -> str:
    return (
        "यदि आप कोई खुराक भूल गए हैं, तो याद आते ही लें, जब तक अगली खुराक का समय बहुत नज़दीक न हो—ऐसे में उसे छोड़ें और सामान्य समय पर लौटें। "
        "बिना डॉक्टर की सलाह के डबल डोज़ न लें। संदेह हो तो अपने फार्मासिस्ट/डॉक्टर से संपर्क करें।"
    )

def _generic_emergency_localized(lang: str) -> str:
    # Keep it brief and universal; mention local emergency number generically
    if lang == "fr":
        return "Douleur thoracique et essoufflement peuvent être des urgences. Appelez les urgences (112/15) ou rendez-vous aux urgences maintenant."
    if lang == "ar":
        return "ألم الصدر وضيق التنفس قد يكونان حالة طارئة. اتصل بخدمات الطوارئ أو اذهب إلى قسم الطوارئ الآن."
    if lang == "hi":
        return "सीने में दर्द और साँस लेने में तकलीफ़ आपात स्थिति हो सकती है। अपने स्थानीय आपातकालीन नंबर पर कॉल करें या तुरंत इमरजेंसी विभाग जाएँ."
    # default English
    return _emergency_reply()

# ---- Optional Gemini augmentation (never raises) ----
def _maybe_gemini_reply(meds: List[Dict[str, str]], user: User, message: str) -> Optional[str]:
    if not _should_try_ai():
        return None
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        import google.generativeai as genai  # type: ignore
        from google.api_core.exceptions import ResourceExhausted  # type: ignore
    except Exception:
        return None

    try:
        genai.configure(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        model = genai.GenerativeModel(model_name)

        meds_lines = []
        for m in meds:
            if m["times"]:
                meds_lines.append(f"- {m['name']}: {', '.join(m['times'])}")
            else:
                meds_lines.append(f"- {m['name']}")
        context = (
            "You are a concise, safety-first medication assistant. "
            "Never give personalized dosing or diagnosis. Suggest contacting a pharmacist/healthcare provider when appropriate. "
            "Use the user’s med list if relevant; otherwise, ask 1 brief clarifying question.\n\n"
            f"User: {getattr(user, 'name', 'User')}\n"
            f"Med List:\n" + ("\n".join(meds_lines) if meds_lines else "(none)")
        )
        prompt = f"{context}\n\nUser message:\n{message}\n\nReply in 1–4 sentences."

        resp = model.generate_content(prompt)
        txt = getattr(resp, "text", None)
        if not txt and getattr(resp, "candidates", None):
            txt = resp.candidates[0].content.parts[0].text
        return (txt or "").strip() or None

    except Exception as e:
        # Rate limit? Put AI into backoff and fall back silently.
        msg = str(e)
        if "429" in msg or "quota" in msg.lower():
            # Try to read retry hint if present; otherwise 60s
            _record_ai_backoff(60)
        return None

# ---- Main generator (heuristics FIRST, AI optional second) ----
def generate_coach_reply(db: Session, user: User, message: str) -> str:
    msg = (message or "").strip()
    msg_lc = msg.lower()
    meds = _list_user_meds(db, user)

    # ===== Multilingual quick rules =====
    # Spanish
    if any(k in msg_lc for k in ["¿", " qué hago", "olvidé", "olvide", "dosis", "noche", "mañana", "manana"]):
        if "olvid" in msg_lc or "dosis" in msg_lc:
            return _spanish_missed_dose()
        if "dolor de pecho" in msg_lc or "falta de aire" in msg_lc:
            return _generic_emergency_localized("es")

    # French
    if any(k in msg_lc for k in ["j'ai oublié", "jai oublié", "jai oublie", "dose", "que faire"]):
        if "oubli" in msg_lc or "oublié" in msg_lc or "dose" in msg_lc:
            return _french_missed_dose()
    if "douleur thoracique" in msg_lc or "essoufflement" in msg_lc:
        return _generic_emergency_localized("fr")

    # Arabic (normalize common words without diacritics)
    if any(k in msg for k in ["نسيت", "جرعة", "ماذا أفعل", "ماذا افعل"]):
        return _arabic_missed_dose()
    if "ألم صدر" in msg or "الم صدر" in msg or "ضيق نفس" in msg:
        return _generic_emergency_localized("ar")

    # Hindi
    if any(k in msg for k in ["खुराक", "भूल", "क्या करूँ", "क्या करुं", "क्या करूं"]):
        return _hindi_missed_dose()
    if "सीने में दर्द" in msg or "साँस" in msg or "सांस" in msg:
        return _generic_emergency_localized("hi")

    # ===== English heuristics =====
    # Greetings
    if any(w in msg_lc.split() for w in ["hi", "hello", "hey"]):
        return "Hello! How can I help with your medications today?"

    # “Should I call 911?” explicit
    if "should i call 911" in msg_lc or "call 911" in msg_lc:
        return _emergency_reply()

    # Emergency symptoms
    if ("chest pain" in msg_lc) or ("shortness of breath" in msg_lc) or ("trouble breathing" in msg_lc):
        return _emergency_reply()

    # Summarize today
    if "summarize" in msg_lc or ("today" in msg_lc and "dose" in msg_lc):
        return _summarize_today(meds)

    # Missed / late dose
    if "missed" in msg_lc or ("late" in msg_lc and "dose" in msg_lc):
        return _missed_dose_reply(meds, msg_lc)

    # Side effects
    if any(w in msg_lc for w in ["dizzy", "nausea", "nauseous", "lightheaded"]):
        return _side_effects_reply()

    # Interactions
    if ("ibuprofen" in msg_lc and "warfarin" in msg_lc) or "interaction" in msg_lc:
        return _interaction_reply()

    # Dose changes / double
    if any(w in msg_lc for w in ["double", "increase", "change"]) and any(d in msg_lc for d in ["dose", "dosage"]):
        return _dose_change_reply()

    # Privacy
    if any(w in msg_lc for w in ["ssn", "social security", "social-security"]):
        return _privacy_reply()

    # Grounding
    if "what meds" in msg_lc or ("what" in msg_lc and "am i taking" in msg_lc) or "list my medications" in msg_lc:
        return _grounding_reply(meds)

    # ===== Gemini (optional, never breaks) =====
    ai = _maybe_gemini_reply(meds, user, msg)
    if ai:
        return ai

    # Generic fallback
    return (
        "I’m here to help with medication questions. "
        "You can ask me to summarize today’s doses, discuss missed doses, side effects, "
        "or general safety tips. For personal dosing changes, please contact your provider."
    )
