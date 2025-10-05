from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from .db import Base
from . import models

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    parent_code = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    medications = relationship("Medication", back_populates="user", cascade="all,delete")

class Medication(Base):
    __tablename__ = "medications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)
    times = Column(JSON, nullable=False, default=list)  # e.g. ["08:00","20:00"]
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="medications")
    doses = relationship("Dose", back_populates="medication", cascade="all,delete")

class Dose(Base):
    __tablename__ = "doses"
    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    taken_at = Column(DateTime, nullable=True)
    source = Column(String, nullable=True)  # "user", "parent"
    medication = relationship("Medication", back_populates="doses")
