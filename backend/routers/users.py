import json
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..db import get_db
from ..models import User, Medication, Dose
from ..auth import get_current_user

router = APIRouter(prefix="/doses", tags=["doses"])

# -------- helpers -----------------------------------------------------------

def _daterange(d0: date, d1: date):
    cur = d0
    step = timedelta(days=1)
    while cur <= d1:
        yield cur
        cur += step

def _norm_hhmm(s: str) -> str:
    s = s.strip().lower().replace(".", "")
    ampm = None
    if s.endswith("am") or s.endswith("pm"):
        ampm = s[-2:]
        s = s[:-2].strip()
    if ":" in s:
        hh, mm = s.split(":", 1)
    else:
        hh, mm = s, "00"
    hh = int("".join(c for c in hh if c.isdigit())) if any(ch.isdigit() for ch in hh) else 0
    mm_digits = "".join(c for c in mm if c.isdigit())
    mm = int(mm_digits) if mm_digits else 0
    if ampm == "am":
        if hh == 12: hh = 0
    elif ampm == "pm":
        if hh != 12: hh += 12
    hh = max(0, min(23, hh))
    mm = max(0, min(59, mm))
    return f"{hh:02d}:{mm:02d}"

def _times_list(val) -> List[str]:
    """Return a normalized list even if DB column is a stringified JSON or CSV."""
    if val is None:
        return []
    if isinstance(val, list):
        return [_norm_hhmm(str(x)) for x in val if str(x).strip()]
    if isinstance(val, str):
        v = val.strip()
        if not v:
            return []
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return [_norm_hhmm(str(x)) for x in parsed if str(x).strip()]
        except Exception:
            pass
        return [_norm_hhmm(t) for t in v.split(",") if t.strip()]
    return [_norm_hhmm(str(val))]

def _combine(dt_date: date, hhmm: str) -> datetime:
    hh, mm = [int(x) for x in hhmm.split(":", 1)]
    return datetime(dt_date.year, dt_date.month, dt_date.day, hh, mm)

def _within_active(m: Medication, d: date) -> bool:
    if m.start_date and d < m.start_date:
        return False
    if m.end_date and d > m.end_date:
        return False
    return True

def _ensure_dose(db: Session, medication_id: int, scheduled_at: datetime) -> Dose:
    row = (
        db.query(Dose)
        .filter(Dose.medication_id == medication_id, Dose.scheduled_at == scheduled_at)
        .first()
    )
    if row:
        return row
    row = Dose(medication_id=medication_id, scheduled_at=scheduled_at)
    db.add(row)
    return row

def _parse_window(window: Optional[str], start: Optional[str], end: Optional[str]) -> Tuple[date, date]:
    if window == "today" or (not window and not start and not end):
        d0 = datetime.utcnow().date()
        return d0, d0
    if window == "upcoming":
        d0 = datetime.utcnow().date()
        return d0, d0 + timedelta(days=7)
    if window == "week":
        today = datetime.utcnow().date()
        d0 = today - timedelta(days=today.weekday())
        return d0, d0 + timedelta(days=6)
    if start:
        d0 = date.fromisoformat(start)
        d1 = date.fromisoformat(end) if end else d0
        return d0, d1
    d0 = datetime.utcnow().date()
    return d0, d0

# -------- routes ------------------------------------------------------------

@router.get("")
def list_doses(
    window: Optional[str] = Query(None, description="today|upcoming|week|range"),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    d0, d1 = _parse_window(window, start, end)

    meds: List[Medication] = db.query(Medication).filter(Medication.user_id == user.id).all()

    # Materialize doses for the requested window (idempotent)
    for m in meds:
        times = _times_list(m.times)  # <-- normalize to avoid '[' bug
        for day in _daterange(d0, d1):
            if not _within_active(m, day):
                continue
            for t in times:
                _ensure_dose(db, m.id, _combine(day, t))
    db.commit()

    rows: List[Dose] = (
        db.query(Dose)
        .options(joinedload(Dose.medication))
        .join(Medication, Dose.medication_id == Medication.id)
        .filter(
            Medication.user_id == user.id,
            Dose.scheduled_at >= datetime(d0.year, d0.month, d0.day),
            Dose.scheduled_at < datetime(d1.year, d1.month, d1.day) + timedelta(days=1),
        )
        .order_by(Dose.scheduled_at.asc())
        .all()
    )

    out = []
    taken_count = 0
    total = 0
    for r in rows:
        total += 1
        if r.taken_at:
            taken_count += 1
        out.append({
            "id": r.id,
            "scheduled_at": r.scheduled_at,
            "taken_at": r.taken_at,
            "source": r.source,
            "medication": {
                "id": r.medication.id,
                "name": r.medication.name,
                "dosage": r.medication.dosage,
            },
        })

    return {"window": {"start": d0, "end": d1}, "counts": {"taken": taken_count, "total": total}, "items": out}

@router.post("/{dose_id}/taken")
def mark_taken(
    dose_id: int,
    parent_code: Optional[str] = Query(None, description="Required if parent_code is set on the account"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    dose = db.get(Dose, dose_id)
    if not dose:
        raise HTTPException(status_code=404, detail="Dose not found")

    med = db.get(Medication, dose.medication_id)
    if not med or med.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")

    # Enforce guardian code when set
    if user.parent_code:
        if not parent_code or str(parent_code).strip() != user.parent_code:
            raise HTTPException(status_code=401, detail="Parent code required")

    # Idempotent
    if dose.taken_at:
        return {
            "id": dose.id,
            "scheduled_at": dose.scheduled_at,
            "taken_at": dose.taken_at,
            "source": dose.source or ("parent" if user.parent_code and parent_code else "user"),
        }

    dose.taken_at = datetime.utcnow()
    dose.source = "parent" if (user.parent_code and parent_code) else "user"
    db.add(dose)
    db.commit()
    db.refresh(dose)
    return {
        "id": dose.id,
        "scheduled_at": dose.scheduled_at,
        "taken_at": dose.taken_at,
        "source": dose.source,
    }

