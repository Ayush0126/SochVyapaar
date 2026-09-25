from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.models.metrics import DailyMetrics
from app.schemas.metrics import MetricsCreate, MetricsResponse, MetricsSummary, RecentEntry
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.post("", response_model=MetricsResponse)
def add_metrics(metrics: MetricsCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found. Please create a shop first.")

    # Check if entry exists for this date — update if so
    existing = db.query(DailyMetrics).filter(
        DailyMetrics.shop_id == shop.id,
        DailyMetrics.date == metrics.date
    ).first()

    if existing:
        existing.sales = metrics.sales
        existing.expenses = metrics.expenses
        existing.footfall = metrics.footfall
        existing.stock_value = metrics.stock_value
        db.commit()
        db.refresh(existing)
        return existing

    new_metrics = DailyMetrics(
        shop_id=shop.id,
        date=metrics.date,
        sales=metrics.sales,
        expenses=metrics.expenses,
        footfall=metrics.footfall,
        stock_value=metrics.stock_value
    )
    db.add(new_metrics)
    db.commit()
    db.refresh(new_metrics)
    return new_metrics

@router.get("", response_model=List[MetricsResponse])
def get_metrics(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    cutoff_date = (datetime.utcnow() - timedelta(days=days)).date()
    metrics = db.query(DailyMetrics).filter(
        DailyMetrics.shop_id == shop.id,
        DailyMetrics.date >= cutoff_date
    ).order_by(DailyMetrics.date.desc()).all()

    return metrics

@router.get("/summary")
def get_metrics_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    today = datetime.utcnow().date()

    # Get most recent metrics entry
    latest = db.query(DailyMetrics).filter(
        DailyMetrics.shop_id == shop.id
    ).order_by(DailyMetrics.date.desc()).first()

    # Get last 7 entries for recent data
    recent = db.query(DailyMetrics).filter(
        DailyMetrics.shop_id == shop.id
    ).order_by(DailyMetrics.date.desc()).limit(7).all()

    # Calculate period comparison (last 14 days vs previous 14 days)
    fourteen_days_ago = today - timedelta(days=14)
    twenty_eight_days_ago = today - timedelta(days=28)

    current_metrics = db.query(DailyMetrics).filter(
        DailyMetrics.shop_id == shop.id,
        DailyMetrics.date > fourteen_days_ago,
        DailyMetrics.date <= today
    ).all()

    prev_metrics = db.query(DailyMetrics).filter(
        DailyMetrics.shop_id == shop.id,
        DailyMetrics.date > twenty_eight_days_ago,
        DailyMetrics.date <= fourteen_days_ago
    ).all()

    def avg_metric(metrics_list, attr):
        vals = [getattr(m, attr) or 0 for m in metrics_list]
        return sum(vals) / len(vals) if vals else 0

    def calc_change(curr, prev):
        if prev == 0:
            return 100.0 if curr > 0 else 0.0
        return round(((curr - prev) / prev) * 100.0, 1)

    curr_avg_sales = avg_metric(current_metrics, 'sales')
    prev_avg_sales = avg_metric(prev_metrics, 'sales')
    curr_avg_expenses = avg_metric(current_metrics, 'expenses')
    prev_avg_expenses = avg_metric(prev_metrics, 'expenses')
    curr_avg_footfall = avg_metric(current_metrics, 'footfall')
    prev_avg_footfall = avg_metric(prev_metrics, 'footfall')

    recent_entries = [
        {
            "date": str(m.date),
            "sales": m.sales,
            "expenses": m.expenses,
            "footfall": m.footfall
        }
        for m in recent
    ]

    return {
        "today_sales": latest.sales if latest else 0,
        "today_expenses": latest.expenses if latest else 0,
        "today_footfall": latest.footfall if latest else 0,
        "latest_stock_value": latest.stock_value if latest else 0,
        "sales_change": calc_change(curr_avg_sales, prev_avg_sales),
        "expense_change": calc_change(curr_avg_expenses, prev_avg_expenses),
        "footfall_change": calc_change(curr_avg_footfall, prev_avg_footfall),
        "recent_entries": recent_entries
    }

@router.delete("/{id}")
def delete_metric(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    metric = db.query(DailyMetrics).filter(DailyMetrics.id == id, DailyMetrics.shop_id == shop.id).first()
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")

    db.delete(metric)
    db.commit()
    return {"message": "Metric deleted successfully"}


# --- Voice Parsing ---

class VoiceParseRequest(BaseModel):
    text: str
    language: str = 'en'

@router.post("/parse-voice")
def parse_voice_input(req: VoiceParseRequest, current_user: User = Depends(get_current_user)):
    import re, json, os
    text = req.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    # Try Gemini first
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and api_key != "your-gemini-api-key":
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = f"""Extract business metrics from this spoken text. The person is a small shop owner in India.

Text: "{text}"

Return ONLY a valid JSON object with these fields (use null if not mentioned):
{{"sales": number_or_null, "expenses": number_or_null, "footfall": number_or_null, "stock_value": number_or_null}}

Rules:
- "bikri" or "sale" or "sales" = sales
- "kharch" or "kharcha" or "expense" = expenses
- "grahak" or "customer" or "footfall" or "log" = footfall
- "stock" or "maal" or "inventory" = stock_value
- Numbers like "8 hazar" or "8 thousand" = 8000
- Numbers like "saadhe 8 hazar" = 8500
- Only return the JSON, nothing else."""

            response = client.models.generate_content(model='gemini-3.5-flash-lite', contents=prompt)
            resp_text = response.text.strip()
            if resp_text.startswith("```"):
                resp_text = resp_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            parsed = json.loads(resp_text)
            return {"parsed": parsed, "original_text": text, "method": "ai"}
        except Exception as e:
            print(f"Gemini voice parse error: {e}")

    # Regex fallback
    parsed = {"sales": None, "expenses": None, "footfall": None, "stock_value": None}
    text_lower = text.lower()

    def extract_number(pattern, txt):
        match = re.search(pattern, txt, re.IGNORECASE)
        if match:
            num_str = match.group(1).replace(',', '').strip()
            try:
                return float(num_str)
            except ValueError:
                return None
        return None

    # Sales patterns
    for pattern in [
        r'sales?\s+(?:were?|was|is|are|of)?\s*(?:rs\.?|₹|rupees?)?\s*([\d,]+)',
        r'(?:rs\.?|₹|rupees?)\s*([\d,]+)\s*(?:sales?|bikri)',
        r'bikri\s+(?:rs\.?|₹)?\s*([\d,]+)',
        r'sales?\s*([\d,]+)',
    ]:
        val = extract_number(pattern, text_lower)
        if val:
            parsed["sales"] = val
            break

    # Expenses patterns
    for pattern in [
        r'expense[s]?\s+(?:were?|was|is|are|of)?\s*(?:rs\.?|₹|rupees?)?\s*([\d,]+)',
        r'(?:rs\.?|₹|rupees?)\s*([\d,]+)\s*(?:expense|kharch)',
        r'kharch[a]?\s+(?:rs\.?|₹)?\s*([\d,]+)',
        r'expense[s]?\s*([\d,]+)',
    ]:
        val = extract_number(pattern, text_lower)
        if val:
            parsed["expenses"] = val
            break

    # Footfall patterns
    for pattern in [
        r'([\d,]+)\s*(?:customers?|grahak|log|people|visitors?|footfall)',
        r'(?:customers?|grahak|footfall)\s+(?:were?|was|is|are|of)?\s*([\d,]+)',
    ]:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            num_str = match.group(1).replace(',', '').strip()
            try:
                parsed["footfall"] = int(float(num_str))
            except ValueError:
                pass
            break

    # Stock patterns
    for pattern in [
        r'stock\s+(?:value\s+)?(?:were?|was|is|of)?\s*(?:rs\.?|₹|rupees?)?\s*([\d,]+)',
        r'(?:rs\.?|₹)?\s*([\d,]+)\s*(?:stock|maal|inventory)',
    ]:
        val = extract_number(pattern, text_lower)
        if val:
            parsed["stock_value"] = val
            break

    return {"parsed": parsed, "original_text": text, "method": "regex"}

