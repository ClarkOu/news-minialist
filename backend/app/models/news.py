from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..db.database import Base
from .associations import news_category

class News(Base):
    """新闻模型"""
    __tablename__ = "news"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String, nullable=False)
    url = Column(String, nullable=False, unique=True)
    published_at = Column(DateTime, nullable=False, default=datetime.now)
    crawled_at = Column(DateTime, nullable=False, default=datetime.now)
    importance_score = Column(Float, nullable=False, default=5.0)
    raw_html = Column(Text, nullable=True)
    
    # 关系
    categories = relationship("Category", secondary=news_category, back_populates="news")
    
    def __repr__(self):
        return f"<News(id={self.id}, title={self.title})>"