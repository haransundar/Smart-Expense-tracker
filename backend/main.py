from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List, Optional
from decimal import Decimal

from database import engine, get_db, Base
from models import User, Expense, Subscription, PaymentMethod, FamilyGroup, FamilyMember
from schemas import (
    UserCreate, UserResponse, ExpenseCreate, ExpenseResponse,
    SubscriptionResponse, BurnRateResponse, Token, PaymentMethodCreate,
    FamilyGroupCreate
)
from auth import authenticate_user, create_access_token, get_password_hash
from config import settings
from services.smart_translator import SmartTranslator
from services.subscription_detective import SubscriptionDetective
from services.burn_rate_forecaster import BurnRateForecaster

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Expense Tracker API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Auth endpoints
@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user.email,
        password_hash=get_password_hash(user.password),
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Expense endpoints
@app.post("/expenses", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user_id: int = 1  # TODO: Get from token
):
    # Use Smart Translator
    translator = SmartTranslator(db)
    merchant_name, category_id = translator.translate(expense.original_text)
    
    new_expense = Expense(
        user_id=current_user_id,
        amount=expense.amount,
        category_id=category_id or expense.category_id,
        payment_method_id=expense.payment_method_id,
        description=expense.description,
        original_text=expense.original_text,
        merchant_name=merchant_name,
        transaction_date=expense.transaction_date,
        family_group_id=expense.family_group_id
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    return new_expense

@app.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: int = 1
):
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user_id
    ).order_by(Expense.transaction_date.desc()).offset(skip).limit(limit).all()
    return expenses

# Subscription endpoints
@app.post("/subscriptions/scan")
def scan_subscriptions(
    db: Session = Depends(get_db),
    current_user_id: int = 1
):
    detective = SubscriptionDetective(db)
    detected = detective.scan_for_subscriptions(current_user_id)
    return {"detected_count": len(detected), "subscriptions": detected}

@app.get("/subscriptions", response_model=List[SubscriptionResponse])
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user_id: int = 1
):
    subs = db.query(Subscription).filter(
        Subscription.user_id == current_user_id,
        Subscription.is_active == True
    ).all()
    return subs

@app.get("/subscriptions/upcoming")
def get_upcoming_subscriptions(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user_id: int = 1
):
    detective = SubscriptionDetective(db)
    upcoming = detective.get_upcoming_subscriptions(current_user_id, days)
    return upcoming

# Burn Rate endpoints
@app.get("/burn-rate")
def get_burn_rate(
    current_balance: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user_id: int = 1
):
    forecaster = BurnRateForecaster(db)
    balance = Decimal(str(current_balance)) if current_balance else None
    analysis = forecaster.calculate_burn_rate(current_user_id, balance)
    return analysis

@app.get("/spending-trends")
def get_spending_trends(
    months: int = 3,
    db: Session = Depends(get_db),
    current_user_id: int = 1
):
    forecaster = BurnRateForecaster(db)
    trends = forecaster.get_spending_trends(current_user_id, months)
    return trends

# Payment Method endpoints
@app.post("/payment-methods")
def create_payment_method(
    method: PaymentMethodCreate,
    db: Session = Depends(get_db),
    current_user_id: int = 1
):
    new_method = PaymentMethod(
        user_id=current_user_id,
        method_type=method.method_type,
        method_name=method.method_name,
        last_four=method.last_four
    )
    db.add(new_method)
    db.commit()
    db.refresh(new_method)
    return new_method

# Family Group endpoints
@app.post("/family-groups")
def create_family_group(
    group: FamilyGroupCreate,
    db: Session = Depends(get_db),
    current_user_id: int = 1
):
    new_group = FamilyGroup(
        name=group.name,
        created_by=current_user_id
    )
    db.add(new_group)
    db.commit()
    
    # Add creator as admin
    member = FamilyMember(
        family_group_id=new_group.id,
        user_id=current_user_id,
        role="admin"
    )
    db.add(member)
    db.commit()
    db.refresh(new_group)
    return new_group

@app.get("/family-groups/{group_id}/expenses")
def get_family_expenses(
    group_id: int,
    db: Session = Depends(get_db)
):
    expenses = db.query(Expense).filter(
        Expense.family_group_id == group_id
    ).order_by(Expense.transaction_date.desc()).all()
    return expenses

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
