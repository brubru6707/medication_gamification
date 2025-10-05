import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .db import get_db
from .models import User
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME_SUPER_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)

try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": "medication-gamification",
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": os.getenv("FIREBASE_CERT_URL")
    })
    firebase_admin.initialize_app(cred)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme),
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    firebase_token = None
    if bearer and bearer.credentials:
        firebase_token = bearer.credentials
    elif token:
        firebase_token = token
    
    if firebase_token:
        try:
            decoded_token = firebase_auth.verify_id_token(firebase_token)
            firebase_uid = decoded_token.get('uid')
            email = decoded_token.get('email')
            
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    name=decoded_token.get('name', email.split('@')[0]),
                    email=email,
                    password_hash="firebase_user",
                    parent_code=decoded_token.get('parent_code')
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            return user
        except Exception as e:
            print(f"Firebase token validation failed: {e}")
    
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: int = int(payload.get("sub"))
            if user_id is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
        user = db.get(User, user_id)
        if not user:
            raise credentials_exception
        return user
    
    raise credentials_exception
