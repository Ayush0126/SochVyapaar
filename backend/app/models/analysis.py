from sqlalchemy import Column, Integer, Float, Date, DateTime, String, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"))
    analysis_date = Column(Date)
    sales_change = Column(Float)
    footfall_change = Column(Float)
    expense_change = Column(Float)
    root_cause = Column(String)
    confidence = Column(Float)
    severity = Column(String, default="medium")
    explanation = Column(Text)
    recommendation = Column(String)
    estimated_cost = Column(String)
    evidence_json = Column(Text, default="[]")          # JSON string of evidence list
    recommendations_json = Column(Text, default="[]")   # JSON string of recommendations list
    monitoring_period = Column(String, default="14 days")
    created_at = Column(DateTime, default=func.now())

    shop = relationship("Shop", backref="analyses")
