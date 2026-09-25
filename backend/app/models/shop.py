from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    shop_name = Column(String)
    business_type = Column(String)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", backref="shops")
