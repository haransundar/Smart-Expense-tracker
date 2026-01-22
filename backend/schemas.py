from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    amount: Decimal
    category_id: Optional[int] = None
    payment_method_id: int
    description: Optional[str] = None
    original_text: Optional[str] = None
    transaction_date: datetime
    family_group_id: Optional[int] = None

class ExpenseResponse(BaseModel):
    id: int
    amount: Decimal
    category_id: Optional[int]
    merchant_name: Optional[str]
    description: Optional[str]
    transaction_date: datetime
    is_recurring: bool
    
    class Config:
        from_attributes = True

class SubscriptionResponse(BaseModel):
    id: int
    merchant_name: str
    amount: Decimal
    frequency: str
    next_payment_date: Optional[date]
    is_active: bool
    
    class Config:
        from_attributes = True

class BurnRateResponse(BaseModel):
    daily_burn_rate: Decimal
    days_until_broke: Optional[int]
    projected_month_end_balance: Decimal
    warning_level: str  # 'safe', 'warning', 'critical'

class PaymentMethodCreate(BaseModel):
    method_type: str
    method_name: str
    last_four: Optional[str] = None

class FamilyGroupCreate(BaseModel):
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str
