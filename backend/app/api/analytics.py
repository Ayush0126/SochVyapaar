from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timedelta
import pandas as pd
from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.models.metrics import DailyMetrics
from app.services.auth import get_current_user
from app.analytics.engine import AnalyticsEngine

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("")
def get_analytics(days: int = Query(30, description="Days to analyze (7, 30, 90)"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
        
    cutoff_date = (datetime.utcnow() - timedelta(days=days*2)).date() # Fetch extra for previous period
    metrics = db.query(DailyMetrics).filter(
        DailyMetrics.shop_id == shop.id,
        DailyMetrics.date >= cutoff_date
    ).order_by(DailyMetrics.date.asc()).all()
    
    if not metrics:
        return {"message": "Not enough data"}
        
    metrics_data = []
    for m in metrics:
        metrics_data.append({
            "date": m.date,
            "sales": m.sales,
            "expenses": m.expenses,
            "footfall": m.footfall,
            "stock_value": m.stock_value
        })
        
    engine = AnalyticsEngine()
    summary = engine.calculate_summary(metrics_data, current_days=days)
    
    return summary
