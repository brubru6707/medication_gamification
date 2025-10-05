# backend/routers/alerts.py
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["alerts"])

class NotifyIn(BaseModel):
    phone: str
    message: str

@router.post("/notify")
def notify_contact(payload: NotifyIn, _user=Depends(get_current_user)):
    # Optional Twilio SMS (non-emergency). Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM.
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    tok = os.getenv("TWILIO_AUTH_TOKEN")
    frm = os.getenv("TWILIO_FROM")
    if not (sid and tok and frm):
        raise HTTPException(status_code=501, detail="SMS not configured on server")
    try:
        from twilio.rest import Client  # type: ignore
        client = Client(sid, tok)
        m = client.messages.create(to=payload.phone, from_=frm, body=payload.message)
        return {"status": "sent", "sid": m.sid}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"SMS failed: {e}")
