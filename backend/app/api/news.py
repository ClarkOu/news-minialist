from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..db.database import get_db
from ..models.news import News
from ..models.category import Category
from pydantic import BaseModel

router = APIRouter()

# 新闻响应模型
class CategoryResponse(BaseModel):
    id: str
    name: str
    
    class Config:
        from_attributes = True

class NewsResponse(BaseModel):
    id: str
    title: str
    summary: str
    source: str
    url: str
    published_at: datetime
    importance_score: float
    categories: List[CategoryResponse]
    
    class Config:
        from_attributes = True

class NewsDetailResponse(NewsResponse):
    content: str
    crawled_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/news", response_model=List[NewsResponse])
async def get_news(
    category: Optional[str] = None,
    min_score: Optional[float] = Query(0, ge=0, le=10),
    days: Optional[int] = Query(7, ge=1, le=30),
    skip: Optional[int] = Query(0, ge=0),
    limit: Optional[int] = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取新闻列表，可根据分类、重要性评分和时间范围筛选"""
    # 构建基础查询
    query = db.query(News)
    
    # 应用分类过滤
    if category:
        query = query.join(News.categories).filter(Category.name == category)
    
    # 应用评分过滤
    if min_score > 0:
        query = query.filter(News.importance_score >= min_score)
    
    # 应用时间范围过滤
    if days:
        time_threshold = datetime.now() - timedelta(days=days)
        query = query.filter(News.published_at >= time_threshold)
    
    # 排序、分页
    total = query.count()
    news_items = query.order_by(News.importance_score.desc(), News.published_at.desc()).offset(skip).limit(limit).all()
    return news_items

@router.get("/news/{news_id}", response_model=NewsDetailResponse)
async def get_news_detail(news_id: str, db: Session = Depends(get_db)):
    """根据ID获取新闻详情"""
    news = db.query(News).filter(News.id == news_id).first()
    
    if not news:
        raise HTTPException(status_code=404, detail="新闻不存在")
    
    return news