from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ActionCreate(BaseModel):
    analysis_id: int
    action: str

class ActionUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[str] = None

class ActionResponse(BaseModel):
    id: int
    analysis_id: int
    shop_id: int
    action: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
