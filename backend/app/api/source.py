from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..db.database import get_db
from ..models.source import Source, UserSourceSubscription
from ..models.user import User

router = APIRouter()

from typing import Optional
class SourceIn(BaseModel):
    name: str
    url: str
    description: Optional[str] = None

from datetime import datetime

class SourceOut(BaseModel):
    id: str
    name: str
    url: str
    description: str = None
    created_at: datetime
    class Config:
        orm_mode = True

class SourceSubIn(BaseModel):
    user_id: str
    source_id: str

from datetime import datetime

class SourceSubOut(BaseModel):
    id: str
    user_id: str
    source_id: str
    created_at: datetime
    class Config:
        orm_mode = True

@router.post("/source", response_model=SourceOut)
def add_source(data: SourceIn, db: Session = Depends(get_db)):
    url_str = str(data.url)
    exists = db.query(Source).filter_by(url=url_str).first()
    if exists:
        raise HTTPException(status_code=400, detail="该信息源已存在")
    src = Source(name=data.name, url=url_str, description=data.description)
    db.add(src)
    db.commit()
    db.refresh(src)
    return src

@router.get("/sources", response_model=List[SourceOut])
def get_sources(db: Session = Depends(get_db)):
    return db.query(Source).all()

@router.post("/source/subscribe", response_model=SourceSubOut)
def subscribe_source(data: SourceSubIn, db: Session = Depends(get_db)):
    exists = db.query(UserSourceSubscription).filter_by(user_id=data.user_id, source_id=data.source_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="已订阅该信息源")
    sub = UserSourceSubscription(user_id=data.user_id, source_id=data.source_id)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.post("/source/unsubscribe", response_model=dict)
def unsubscribe_source(data: SourceSubIn, db: Session = Depends(get_db)):
    sub = db.query(UserSourceSubscription).filter_by(user_id=data.user_id, source_id=data.source_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="未订阅该信息源")
    db.delete(sub)
    db.commit()
    return {"message": "取消订阅成功"}

@router.get("/source/subscriptions/{user_id}", response_model=List[SourceSubOut])
def get_user_source_subs(user_id: str, db: Session = Depends(get_db)):
    return db.query(UserSourceSubscription).filter_by(user_id=user_id).all()
