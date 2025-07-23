from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from ..db.database import Base

class UserCategorySubscription(Base):
    """
    用户-频道订阅关系表
    """
    __tablename__ = "user_category_subscriptions"
    __table_args__ = (
        UniqueConstraint('user_id', 'category_id', name='uix_user_category'),
    )

    id = Column(String, primary_key=True, default=lambda: str(datetime.now().timestamp()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    category_id = Column(String, ForeignKey('categories.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    # 可选：定义关系，方便ORM查询
    user = relationship("User", backref="subscriptions")
    category = relationship("Category", backref="subscribers")

    def __repr__(self):
        return f"<UserCategorySubscription(user_id={self.user_id}, category_id={self.category_id})>"
