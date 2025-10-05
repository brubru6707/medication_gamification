# backend/schemas.py
from __future__ import annotations

import json
from datetime import date, datetime
from typing import List, Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict


# ---------- Auth ----------
class SignupIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    email: EmailStr
    password: str
    date_of_birth: date | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    date_of_birth: date | None = None


class TokenOut(BaseModel):
    access_token: str
    user: UserOut


# ---------- Chat ----------
class ChatIn(BaseModel):
    message: str


class ChatOut(BaseModel):
    reply: str


class ChatOutPlus(BaseModel):
    reply: str
    intent: str
    risk_level: Literal["green", "yellow", "red"]
    language: Literal["en", "es", "fr", "ar", "hi"]
    used_ai: bool = True
    actions: List[str] = Field(default_factory=list)


# ---------- Medications ----------
class MedicationBase(BaseModel):
    name: str
    dosage: str | None = None
    times: List[str] = Field(default_factory=list)

    @field_validator("times", mode="before")
    @classmethod
    def _coerce_times(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return [str(x) for x in v]
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return []
            # accept JSON array or comma-separated
            try:
                parsed = json.loads(s)
                if isinstance(parsed, list):
                    return [str(x) for x in parsed]
            except Exception:
                pass
            return [t.strip() for t in s.split(",") if t.strip()]
        return [str(v)]


class MedicationCreate(MedicationBase):
    # Keep dates optional; router can ignore them if your DB doesn’t have these columns.
    start_date: date | None = None
    end_date: date | None = None


class MedicationOut(MedicationBase):
    id: int


# ---------- Doses ----------
class DoseOut(BaseModel):
    """
    A flexible outgoing shape for doses.
    """
    id: int
    medication_id: int | None = None
    medication_name: str | None = None
    scheduled_at: datetime | None = None
    taken_at: datetime | None = None

    model_config = ConfigDict(extra="allow")

