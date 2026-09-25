from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import json
from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.models.metrics import DailyMetrics
from app.models.analysis import Analysis
from app.schemas.analysis import AnalysisResponse, InsightRequest
from app.services.auth import get_current_user
from app.analytics.engine import AnalyticsEngine
from app.analytics.root_cause import RootCauseEngine
from app.ai.gemini import AIService

router = APIRouter(prefix="/api/insights", tags=["insights"])


def analysis_to_dict(a: Analysis) -> dict:
    """Convert an Analysis ORM object to a dict matching AnalysisResponse."""
    evidence = []
    recommendations = []
    try:
        evidence = json.loads(a.evidence_json) if a.evidence_json else []
    except (json.JSONDecodeError, TypeError):
        evidence = []
    try:
        recommendations = json.loads(a.recommendations_json) if a.recommendations_json else []
    except (json.JSONDecodeError, TypeError):
        recommendations = []

    return {
        "id": a.id,
        "shop_id": a.shop_id,
        "analysis_date": a.analysis_date,
        "sales_change": a.sales_change,
        "footfall_change": a.footfall_change,
        "expense_change": a.expense_change,
        "root_cause": a.root_cause,
        "confidence": a.confidence,
        "severity": a.severity or "medium",
        "explanation": a.explanation,
        "recommendation": a.recommendation,
        "estimated_cost": a.estimated_cost,
        "evidence": evidence,
        "recommendations": recommendations,
        "monitoring_period": a.monitoring_period or "14 days",
        "created_at": a.created_at,
    }


@router.get("")
def get_analyses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    analyses = db.query(Analysis).filter(Analysis.shop_id == shop.id).order_by(Analysis.created_at.desc()).all()
    return [analysis_to_dict(a) for a in analyses]


@router.post("/generate")
def generate_insight(
    request: InsightRequest = InsightRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    # 1. Fetch recent metrics (last 60 days to compare 30 vs 30)
    cutoff_date = (datetime.utcnow() - timedelta(days=60)).date()
    metrics = db.query(DailyMetrics).filter(
        DailyMetrics.shop_id == shop.id,
        DailyMetrics.date >= cutoff_date
    ).order_by(DailyMetrics.date.asc()).all()

    if len(metrics) < 3:
        raise HTTPException(status_code=400, detail="Not enough data. Please enter at least 3 days of business data first.")

    metrics_data = [{
        "date": m.date, "sales": m.sales, "expenses": m.expenses,
        "footfall": m.footfall, "stock_value": m.stock_value
    } for m in metrics]

    # 2. Run analytics engine
    analytics_engine = AnalyticsEngine()
    summary = analytics_engine.calculate_summary(metrics_data, current_days=30)

    # 3. Run root cause detection
    rc_engine = RootCauseEngine()
    root_cause_result = rc_engine.detect(summary)

    # 4. Send to AI for explanation
    ai_service = AIService()
    language = request.language or current_user.language or 'en'
    ai_insight = ai_service.generate_insight(
        business_type=shop.business_type,
        analytics_summary=summary,
        root_cause_result=root_cause_result,
        language=language
    )

    # 5. Build recommendations list and evidence
    recs = ai_insight.get('recommendations', [])
    evidence = ai_insight.get('evidence', root_cause_result.get('evidence', []))
    monitoring = ai_insight.get('monitoring_period', '14 days')

    first_rec = recs[0] if recs else {}
    rec_text = first_rec.get('action', 'Review your business strategy')
    rec_cost = first_rec.get('estimated_cost', 'Low')

    # Handle NaN values from pandas
    import math
    def safe_float(val, default=0.0):
        try:
            f = float(val)
            return default if math.isnan(f) or math.isinf(f) else round(f, 1)
        except (TypeError, ValueError):
            return default

    # 6. Save analysis to DB
    try:
        new_analysis = Analysis(
            shop_id=shop.id,
            analysis_date=datetime.utcnow().date(),
            sales_change=safe_float(summary.get('sales_change_pct', 0)),
            footfall_change=safe_float(summary.get('footfall_change_pct', 0)),
            expense_change=safe_float(summary.get('expense_change_pct', 0)),
            root_cause=root_cause_result.get('root_cause', 'Unknown'),
            confidence=safe_float(root_cause_result.get('confidence', 0.5)),
            severity=root_cause_result.get('severity', 'medium'),
            explanation=ai_insight.get('explanation', ''),
            recommendation=rec_text,
            estimated_cost=str(rec_cost),
            evidence_json=json.dumps(evidence, default=str),
            recommendations_json=json.dumps(recs, default=str),
            monitoring_period=str(monitoring),
        )

        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)

        return analysis_to_dict(new_analysis)
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save analysis: {str(e)}")

