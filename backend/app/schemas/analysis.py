from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

class RecommendationItem(BaseModel):
    action: str
    estimated_cost: str = "Low"

class AnalysisResponse(BaseModel):
    id: int
    shop_id: int
    analysis_date: date
    sales_change: float
    footfall_change: float
    expense_change: float
    root_cause: str
    confidence: float
    severity: str = "medium"
    explanation: str
    recommendation: str
    estimated_cost: str
    evidence: List[str] = []
    recommendations: List[RecommendationItem] = []
    monitoring_period: str = "14 days"
    created_at: datetime

    class Config:
        from_attributes = True

class InsightRequest(BaseModel):
    language: Optional[str] = 'en'
