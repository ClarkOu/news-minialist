from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional 
from pydantic import BaseModel

from ..db.database import get_db
from ..models.category import Category

router = APIRouter()

# 分类响应模型
class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    """获取所有新闻分类"""
    categories = db.query(Category).all()
    return categories

@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str, db: Session = Depends(get_db)):
    """根据ID获取分类详情"""
    category = db.query(Category).filter(Category.id == category_id).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="分类不存在")
    
    return category