from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class DailyMetrics(Base):
    __tablename__ = "daily_metrics"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"))
    date = Column(Date)
    sales = Column(Float)
    expenses = Column(Float)
    footfall = Column(Integer)
    stock_value = Column(Float)
    created_at = Column(DateTime, default=func.now())

    shop = relationship("Shop", backref="metrics")
