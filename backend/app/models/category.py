from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
import uuid

from ..db.database import Base
from .associations import news_category

class Category(Base):
    """分类模型"""
    __tablename__ = "categories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    # 关系
    news = relationship("News", secondary=news_category, back_populates="categories")
    
    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name})>"