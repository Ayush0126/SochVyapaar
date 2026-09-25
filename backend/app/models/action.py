from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"))
    shop_id = Column(Integer, ForeignKey("shops.id"))
    action = Column(String)
    status = Column(String, default="pending")
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    result = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

    analysis = relationship("Analysis", backref="actions")
    shop = relationship("Shop", backref="actions")
