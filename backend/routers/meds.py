import json
from datetime import date
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User, Medication
from ..auth import get_current_user

router = APIRouter(prefix="/meds", tags=["meds"])

# -------- helpers -----------------------------------------------------------

def _norm_time_str(s: str) -> str:
    """Accept '08:00', '8:00', '8am', '8:00 PM' → 24h 'HH:MM'."""
    s = s.strip().lower().replace(".", "")
    ampm = None
    if s.endswith("am") or s.endswith("pm"):
        ampm = s[-2:]
        s = s[:-2].strip()
    if ":" in s:
        hh, mm = s.split(":", 1)
    else:
        hh, mm = s, "00"
    hh = int("".join([c for c in hh if c.isdigit()])) if any(c.isdigit() for c in hh) else 0
    mm_digits = "".join([c for c in mm if c.isdigit()])
    mm = int(mm_digits) if mm_digits else 0
    if ampm == "am":
        if hh == 12: hh = 0
    elif ampm == "pm":
        if hh != 12: hh += 12
    hh = max(0, min(23, hh))
    mm = max(0, min(59, mm))
    return f"{hh:02d}:{mm:02d}"

def _coerce_times(val: Union[List[str], str, None]) -> List[str]:
    if val is None:
        return []
    if isinstance(val, list):
        return [_norm_time_str(str(x)) for x in val if str(x).strip()]
    if isinstance(val, str):
        v = v2 = val.strip()
        if not v2:
            return []
        # allow JSON array
        try:
            parsed = json.loads(v2)
            if isinstance(parsed, list):
                return [_norm_time_str(str(x)) for x in parsed if str(x).strip()]
        except Exception:
            pass
        # else comma-separated
        return [_norm_time_str(t) for t in v2.split(",") if t.strip()]
    return [_norm_time_str(str(val))]

# -------- schemas -----------------------------------------------------------

class MedIn(BaseModel):
    name: str
    dosage: Optional[str] = None
    times: Union[List[str], str]
    start_date: Optional[date] = None
    end_date: Optional[date] = None

# -------- routes ------------------------------------------------------------

@router.get("")
def list_meds(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    meds = (
        db.query(Medication)
        .filter(Medication.user_id == user.id)
        .order_by(Medication.created_at.desc())
        .all()
    )
    return [
        {
            "id": m.id,
            "name": m.name,
            "dosage": m.dosage,
            "times": _coerce_times(m.times),  # normalize on the way out
            "start_date": m.start_date,
            "end_date": m.end_date,
            "created_at": m.created_at,
        }
        for m in meds
    ]

@router.post("")
def create_med(body: MedIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Medication name required")

    times = _coerce_times(body.times)
    if not times:
        raise HTTPException(status_code=400, detail="At least one time is required")

    med = Medication(
        user_id=user.id,
        name=name,
        dosage=body.dosage,
        times=times,  # store normalized list
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return {
        "id": med.id,
        "name": med.name,
        "dosage": med.dosage,
        "times": med.times,
        "start_date": med.start_date,
        "end_date": med.end_date,
        "created_at": med.created_at,
    }

@router.delete("/{med_id}")
def delete_med(med_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    med = db.get(Medication, med_id)
    if not med or med.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(med)
    db.commit()
    return {"ok": True}

# --- Scan Rx (OCR optional) ------------------------------------------------

@router.post("/scan")
async def scan_rx(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    image: UploadFile = File(None),
    notes: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
):
    ocr_text = text or notes or ""
    if image is not None and image.filename:
        try:
            from PIL import Image
            import pytesseract
            import io
            content = await image.read()
            img = Image.open(io.BytesIO(content))
            ocr_text = pytesseract.image_to_string(img) or ocr_text
        except Exception:
            pass

    parsed = _parse_rx_text(ocr_text or "")
    return {"raw_text": ocr_text, "suggestion": parsed}

def _parse_rx_text(t: str):
    import re
    t = (t or "").replace("\n", " ")
    name = None
    dosage = None
    times: List[str] = []

    m = re.search(r"\b(\d{1,4})\s*mg\b", t, re.I)
    if m:
        dosage = f"{m.group(1)}mg"
        before = t[:m.start()].strip().split()
        if before:
            name = before[-1].strip(",.")
    if not name:
        m2 = re.search(r"\b([A-Z][a-zA-Z]{2,})\b", t)
        if m2:
            name = m2.group(1)

    if re.search(r"\btwice\s+daily\b", t, re.I):
        times = ["08:00", "20:00"]
    elif re.search(r"\bonce\s+daily\b", t, re.I) or re.search(r"\bdaily\b", t, re.I):
        times = ["08:00"]
    else:
        hhmm = re.findall(r"\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b", t, re.I)
        times = [_norm_time_str(x) for x in hhmm][:4]

    if not name: name = "Medication"
    if not times: times = ["08:00"]
    return {"name": name, "dosage": dosage, "times": times}

