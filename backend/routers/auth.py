from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..schemas import SignupIn, LoginIn, TokenOut, UserOut
from ..auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=TokenOut)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=payload.name.strip(),
        email=payload.email,
        password_hash=hash_password(payload.password),
        date_of_birth=payload.date_of_birth,
    )
    db.add(user); db.commit(); db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return TokenOut(access_token=token, user=UserOut.model_validate(user, from_attributes=True))

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id)})
    return TokenOut(access_token=token, user=UserOut.model_validate(user, from_attributes=True))
