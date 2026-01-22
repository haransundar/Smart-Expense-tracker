from sqlalchemy import Column, Integer, String, Decimal, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    expenses = relationship("Expense", back_populates="user")
    payment_methods = relationship("PaymentMethod", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")

class FamilyGroup(Base):
    __tablename__ = "family_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    
    members = relationship("FamilyMember", back_populates="family_group")
    expenses = relationship("Expense", back_populates="family_group")

class FamilyMember(Base):
    __tablename__ = "family_members"
    
    id = Column(Integer, primary_key=True, index=True)
    family_group_id = Column(Integer, ForeignKey("family_groups.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, default="member")
    joined_at = Column(DateTime, server_default=func.now())
    
    family_group = relationship("FamilyGroup", back_populates="members")

class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    method_type = Column(String, nullable=False)
    method_name = Column(String, nullable=False)
    last_four = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="payment_methods")
    expenses = relationship("Expense", back_populates="payment_method")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    icon = Column(String)
    color = Column(String)
    
    expenses = relationship("Expense", back_populates="category")

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    family_group_id = Column(Integer, ForeignKey("family_groups.id"), nullable=True)
    amount = Column(Decimal(10, 2), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"))
    description = Column(Text)
    original_text = Column(Text)
    merchant_name = Column(String)
    transaction_date = Column(DateTime, nullable=False)
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="expenses")
    family_group = relationship("FamilyGroup", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")
    payment_method = relationship("PaymentMethod", back_populates="expenses")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    merchant_name = Column(String, nullable=False)
    amount = Column(Decimal(10, 2), nullable=False)
    frequency = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    next_payment_date = Column(Date)
    is_active = Column(Boolean, default=True)
    last_detected_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="subscriptions")

class MerchantPattern(Base):
    __tablename__ = "merchant_patterns"
    
    id = Column(Integer, primary_key=True, index=True)
    pattern = Column(String, nullable=False)
    merchant_name = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    confidence_score = Column(Decimal(3, 2), default=0.8)
    created_at = Column(DateTime, server_default=func.now())

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    monthly_limit = Column(Decimal(10, 2), nullable=False)
    alert_threshold = Column(Decimal(3, 2), default=0.8)
    created_at = Column(DateTime, server_default=func.now())
