# 導入所有模型以確保SQLAlchemy能夠正確創建表
from .associations import news_category
from .user import User
from .news import News
from .category import Category
from .history import BrowseHistory
from .source import Source, UserSourceSubscription
from .subscription import UserCategorySubscription

__all__ = [
    'User',
    'News', 
    'Category',
    'BrowseHistory',
    'Source',
    'UserSourceSubscription',
    'UserCategorySubscription',
    'news_category'
]