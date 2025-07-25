from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..db.database import get_db
from ..models.subscription import UserCategorySubscription
from ..models.category import Category
from ..models.user import User

router = APIRouter()

class SubscriptionIn(BaseModel):
    user_id: str
    category_id: str

from datetime import datetime

class SubscriptionOut(BaseModel):
    id: str
    user_id: str
    category_id: str
    created_at: datetime
    class Config:
        orm_mode = True

@router.post("/subscribe", response_model=SubscriptionOut)
def subscribe(data: SubscriptionIn, db: Session = Depends(get_db)):
    # 检查是否已订阅
    exists = db.query(UserCategorySubscription).filter_by(user_id=data.user_id, category_id=data.category_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="已订阅该频道")
    sub = UserCategorySubscription(user_id=data.user_id, category_id=data.category_id)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.post("/unsubscribe", response_model=dict)
def unsubscribe(data: SubscriptionIn, db: Session = Depends(get_db)):
    sub = db.query(UserCategorySubscription).filter_by(user_id=data.user_id, category_id=data.category_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="未订阅该频道")
    db.delete(sub)
    db.commit()
    return {"message": "取消订阅成功"}

@router.get("/subscriptions/{user_id}", response_model=List[SubscriptionOut])
def get_subscriptions(user_id: str, db: Session = Depends(get_db)):
    subs = db.query(UserCategorySubscription).filter_by(user_id=user_id).all()
    return subs
