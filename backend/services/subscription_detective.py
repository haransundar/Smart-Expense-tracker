from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Expense, Subscription, User
from collections import defaultdict
import re

class SubscriptionDetective:
    """Detects recurring payments and predicts next payment dates"""
    
    def __init__(self, db: Session):
        self.db = db
        self.min_occurrences = 2  # Minimum transactions to consider as subscription
    
    def scan_for_subscriptions(self, user_id: int) -> List[Subscription]:
        """Scan user's expense history to detect recurring payments"""
        
        # Get expenses from last 6 months
        six_months_ago = datetime.now() - timedelta(days=180)
        expenses = self.db.query(Expense).filter(
            Expense.user_id == user_id,
            Expense.transaction_date >= six_months_ago
        ).order_by(Expense.transaction_date).all()
        
        # Group by merchant and amount
        merchant_groups = defaultdict(list)
        for expense in expenses:
            if expense.merchant_name:
                key = (expense.merchant_name.lower(), float(expense.amount))
                merchant_groups[key].append(expense)
        
        detected_subscriptions = []
        
        for (merchant, amount), transactions in merchant_groups.items():
            if len(transactions) >= self.min_occurrences:
                frequency = self._detect_frequency(transactions)
                
                if frequency:
                    # Check if subscription already exists
                    existing = self.db.query(Subscription).filter(
                        Subscription.user_id == user_id,
                        Subscription.merchant_name == merchant.title(),
                        Subscription.is_active == True
                    ).first()
                    
                    if not existing:
                        next_date = self._predict_next_payment(transactions, frequency)
                        
                        subscription = Subscription(
                            user_id=user_id,
                            merchant_name=merchant.title(),
                            amount=amount,
                            frequency=frequency,
                            category_id=transactions[0].category_id,
                            next_payment_date=next_date,
                            is_active=True
                        )
                        self.db.add(subscription)
                        detected_subscriptions.append(subscription)
                        
                        # Mark expenses as recurring
                        for txn in transactions:
                            txn.is_recurring = True
        
        if detected_subscriptions:
            self.db.commit()
        
        return detected_subscriptions
    
    def _detect_frequency(self, transactions: List[Expense]) -> str:
        """Detect payment frequency from transaction dates"""
        if len(transactions) < 2:
            return None
        
        # Calculate average days between transactions
        dates = sorted([t.transaction_date for t in transactions])
        intervals = []
        
        for i in range(1, len(dates)):
            delta = (dates[i] - dates[i-1]).days
            intervals.append(delta)
        
        if not intervals:
            return None
        
        avg_interval = sum(intervals) / len(intervals)
        
        # Classify frequency
        if 25 <= avg_interval <= 35:
            return "monthly"
        elif 350 <= avg_interval <= 380:
            return "yearly"
        elif 6 <= avg_interval <= 8:
            return "weekly"
        elif 85 <= avg_interval <= 95:
            return "quarterly"
        
        return None
    
    def _predict_next_payment(self, transactions: List[Expense], frequency: str) -> datetime:
        """Predict next payment date based on frequency"""
        last_transaction = max(transactions, key=lambda x: x.transaction_date)
        last_date = last_transaction.transaction_date
        
        if frequency == "monthly":
            next_date = last_date + timedelta(days=30)
        elif frequency == "yearly":
            next_date = last_date + timedelta(days=365)
        elif frequency == "weekly":
            next_date = last_date + timedelta(days=7)
        elif frequency == "quarterly":
            next_date = last_date + timedelta(days=90)
        else:
            next_date = last_date + timedelta(days=30)
        
        return next_date.date()
    
    def get_upcoming_subscriptions(self, user_id: int, days_ahead: int = 7) -> List[Subscription]:
        """Get subscriptions due in the next N days"""
        today = datetime.now().date()
        future_date = today + timedelta(days=days_ahead)
        
        return self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.is_active == True,
            Subscription.next_payment_date >= today,
            Subscription.next_payment_date <= future_date
        ).all()
    
    def update_subscription_after_payment(self, subscription_id: int):
        """Update next payment date after a payment is detected"""
        subscription = self.db.query(Subscription).get(subscription_id)
        
        if subscription and subscription.frequency:
            if subscription.frequency == "monthly":
                subscription.next_payment_date += timedelta(days=30)
            elif subscription.frequency == "yearly":
                subscription.next_payment_date += timedelta(days=365)
            elif subscription.frequency == "weekly":
                subscription.next_payment_date += timedelta(days=7)
            
            subscription.last_detected_at = datetime.now()
            self.db.commit()
