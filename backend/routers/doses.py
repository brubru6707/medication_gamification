from datetime import datetime, date, time
from typing import List
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..db import get_db
from ..auth import get_current_user
from ..models import User, Medication, Dose
from ..schemas import DoseOut

router = APIRouter(prefix="/doses", tags=["doses"])

def _load_times(val) -> List[str]:
    """Mirror meds helper: list | JSON string | comma-separated -> list[str]."""
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
            return [t.strip() for t in s.split(",") if t.strip()]
        else:
            return parsed if isinstance(parsed, list) else []
    return [str(val)]

def _ensure_today_doses(db: Session, user_id: int):
    today = date.today()
    meds = db.query(Medication).filter(Medication.user_id == user_id).all()
    created = 0
    for m in meds:
        # honor start/end
        if getattr(m, "start_date", None) and today < m.start_date:
            continue
        if getattr(m, "end_date", None) and today > m.end_date:
            continue

        for t in _load_times(getattr(m, "times", [])):
            try:
                hh, mm = map(int, t.split(":"))
                sched_dt = datetime.combine(today, time(hh, mm))
            except Exception:
                # skip malformed time
                continue

            existing = db.query(Dose).filter(
                and_(Dose.medication_id == m.id, Dose.scheduled_at == sched_dt)
            ).first()
            if not existing:
                d = Dose(medication_id=m.id, scheduled_at=sched_dt)
                db.add(d)
                created += 1
    if created:
        db.commit()

@router.get("", response_model=List[DoseOut])
def list_doses(
    window: str = Query("today", description="Supported: today"),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if window != "today":
        raise HTTPException(status_code=400, detail="Only window=today is supported in this MVP")
    _ensure_today_doses(db, current.id)

    today = date.today()
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())
    items = (
        db.query(Dose, Medication)
        .join(Medication, Dose.medication_id == Medication.id)
        .filter(
            and_(Medication.user_id == current.id, Dose.scheduled_at >= start, Dose.scheduled_at <= end)
        )
        .order_by(Dose.scheduled_at.asc())
        .all()
    )
    out: List[DoseOut] = []
    for d, m in items:
        out.append(
            DoseOut(
                id=d.id,
                medication_id=m.id,
                medication_name=m.name,
                scheduled_at=d.scheduled_at,
                taken_at=d.taken_at,
            )
        )
    return out

@router.post("/{dose_id}/taken", response_model=DoseOut)
def mark_taken(dose_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.get(Dose, dose_id)
    if not d:
        raise HTTPException(status_code=404, detail="Dose not found")
    m = db.get(Medication, d.medication_id)
    if not m or m.user_id != current.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    d.taken_at = datetime.utcnow()
    db.commit()
    db.refresh(d)
    return DoseOut(id=d.id, medication_id=m.id, medication_name=m.name, scheduled_at=d.scheduled_at, taken_at=d.taken_at)

