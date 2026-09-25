from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.schemas.shop import ShopCreate, ShopUpdate, ShopResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/shop", tags=["shop"])

@router.post("", response_model=ShopResponse)
def create_shop(shop: ShopCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if existing_shop:
        raise HTTPException(status_code=400, detail="User already has a shop")
    
    new_shop = Shop(
        user_id=current_user.id,
        shop_name=shop.shop_name,
        business_type=shop.business_type,
        location=shop.location
    )
    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)
    return new_shop

@router.get("", response_model=ShopResponse)
def get_shop(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop

@router.put("", response_model=ShopResponse)
def update_shop(shop_update: ShopUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    if shop_update.shop_name is not None:
        shop.shop_name = shop_update.shop_name
    if shop_update.business_type is not None:
        shop.business_type = shop_update.business_type
    if shop_update.location is not None:
        shop.location = shop_update.location
        
    db.commit()
    db.refresh(shop)
    return shop
