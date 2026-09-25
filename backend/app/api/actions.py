from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.models.analysis import Analysis
from app.models.action import Action
from app.models.metrics import DailyMetrics
from app.schemas.action import ActionCreate, ActionUpdate, ActionResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/actions", tags=["actions"])

@router.post("", response_model=ActionResponse)
def create_action(action: ActionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
        
    analysis = db.query(Analysis).filter(Analysis.id == action.analysis_id, Analysis.shop_id == shop.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    new_action = Action(
        analysis_id=action.analysis_id,
        shop_id=shop.id,
        action=action.action,
        status="pending"
    )
    db.add(new_action)
    db.commit()
    db.refresh(new_action)
    return new_action

@router.get("", response_model=List[ActionResponse])
def get_actions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
        
    actions = db.query(Action).filter(Action.shop_id == shop.id).order_by(Action.created_at.desc()).all()
    return actions

@router.put("/{id}", response_model=ActionResponse)
def update_action(id: int, action_update: ActionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
        
    action = db.query(Action).filter(Action.id == id, Action.shop_id == shop.id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if action_update.status:
        action.status = action_update.status
        if action_update.status == "started" and not action.started_at:
            action.started_at = datetime.utcnow()
        elif action_update.status == "completed" and not action.completed_at:
            action.completed_at = datetime.utcnow()
            
    if action_update.result:
        action.result = action_update.result
        
    db.commit()
    db.refresh(action)
    return action

@router.get("/{id}/impact")
def get_action_impact(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
        
    action = db.query(Action).filter(Action.id == id, Action.shop_id == shop.id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if action.status != "completed" or not action.completed_at:
        return {"message": "Action not completed yet, cannot measure impact."}
        
    completion_date = action.completed_at.date()
    
    before_metrics = db.query(DailyMetrics).filter(
        DailyMetrics.shop_id == shop.id,
        DailyMetrics.date >= (completion_date - timedelta(days=14)),
        DailyMetrics.date < completion_date
    ).all()
    
    after_metrics = db.query(DailyMetrics).filter(
        DailyMetrics.shop_id == shop.id,
        DailyMetrics.date >= completion_date,
        DailyMetrics.date <= (completion_date + timedelta(days=14))
    ).all()
    
    if not before_metrics or not after_metrics:
        return {"message": "Not enough data to calculate impact."}
        
    before_sales = sum(m.sales for m in before_metrics) / len(before_metrics)
    after_sales = sum(m.sales for m in after_metrics) / len(after_metrics)
    
    sales_impact = ((after_sales - before_sales) / before_sales * 100) if before_sales > 0 else 0
    
    return {
        "action": action.action,
        "completion_date": completion_date,
        "before_avg_daily_sales": before_sales,
        "after_avg_daily_sales": after_sales,
        "impact_percentage": sales_impact,
        "days_measured_before": len(before_metrics),
        "days_measured_after": len(after_metrics)
    }
