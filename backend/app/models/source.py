from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..db.database import Base

class Source(Base):
    """
    信息源（如RSS、网站等）
    """
    __tablename__ = "sources"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    url = Column(Text, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    def __repr__(self):
        return f"<Source(id={self.id}, name={self.name})>"

class UserSourceSubscription(Base):
    """
    用户-信息源订阅关系
    """
    __tablename__ = "user_source_subscriptions"
    id = Column(String, primary_key=True, default=lambda: str(datetime.now().timestamp()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    source_id = Column(String, ForeignKey('sources.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", backref="source_subscriptions")
    source = relationship("Source", backref="subscribers")

    def __repr__(self):
        return f"<UserSourceSubscription(user_id={self.user_id}, source_id={self.source_id})>"
