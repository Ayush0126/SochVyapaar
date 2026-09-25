from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ShopCreate(BaseModel):
    shop_name: str
    business_type: str
    location: Optional[str] = None

class ShopUpdate(BaseModel):
    shop_name: Optional[str] = None
    business_type: Optional[str] = None
    location: Optional[str] = None

class ShopResponse(BaseModel):
    id: int
    user_id: int
    shop_name: str
    business_type: str
    location: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
