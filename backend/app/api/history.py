from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.history import BrowseHistory
from models.news import News
from models.user import User
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class HistoryIn(BaseModel):
    user_id: str
    news_id: str

class HistoryOut(BaseModel):
    news_id: str
    title: str
    summary: str
    viewed_at: str

    class Config:
        orm_mode = True

@router.post("/add", status_code=201)
def add_history(data: HistoryIn, db: Session = Depends(get_db)):
    print(f"[调试] 收到添加历史请求 user_id={data.user_id}, news_id={data.news_id}")
    news = db.query(News).filter(News.id == data.news_id).first()
    if not news:
        print(f"[调试] 新闻不存在: news_id={data.news_id}")
        raise HTTPException(status_code=404, detail="新闻不存在")
    try:
        history = BrowseHistory(user_id=data.user_id, news_id=data.news_id)
        db.add(history)
        db.commit()
        print(f"[调试] 浏览历史写入成功 user_id={data.user_id}, news_id={data.news_id}")
        return {"msg": "ok"}
    except Exception as e:
        print(f"[调试] 浏览历史写入失败: {e}")
        raise HTTPException(status_code=500, detail="写入历史失败")
    summary: str
    viewed_at: str

    class Config:
        orm_mode = True

@router.get("/", response_model=List[HistoryOut])
def get_history(user_id: str, db: Session = Depends(get_db)):
    # 实际项目应通过token获取当前用户，这里用user_id做演示
    history = db.query(BrowseHistory).join(News).filter(BrowseHistory.user_id == user_id).order_by(BrowseHistory.viewed_at.desc()).limit(20).all()
    return [
        HistoryOut(
            news_id=h.news_id,
            title=h.news.title,
            summary=h.news.summary,
            viewed_at=h.viewed_at.isoformat()
        ) for h in history
    ]
