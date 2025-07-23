from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..db.database import Base

class BrowseHistory(Base):
    __tablename__ = "browse_history"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    news_id = Column(String, ForeignKey('news.id'), nullable=False)
    viewed_at = Column(DateTime, default=datetime.now)

    # 可选：关联用户和新闻对象
    user = relationship("User", backref="browse_history")
    news = relationship("News")
