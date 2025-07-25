from sqlalchemy import Column, String, ForeignKey, Table
from ..db.database import Base

# 新闻-分类关联表
news_category = Table(
    'news_category', 
    Base.metadata,
    Column('news_id', String, ForeignKey('news.id')),
    Column('category_id', String, ForeignKey('categories.id'))
)