from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

class MetricsCreate(BaseModel):
    date: date
    sales: float
    expenses: float
    footfall: int
    stock_value: float

class MetricsResponse(BaseModel):
    id: int
    shop_id: int
    date: date
    sales: float
    expenses: float
    footfall: int
    stock_value: float
    created_at: datetime

    class Config:
        from_attributes = True

class RecentEntry(BaseModel):
    date: date
    sales: float
    expenses: float
    footfall: int

class MetricsSummary(BaseModel):
    today_sales: float = 0
    today_expenses: float = 0
    today_footfall: int = 0
    latest_stock_value: float = 0
    sales_change: float = 0
    expense_change: float = 0
    footfall_change: float = 0
    recent_entries: List[RecentEntry] = []
