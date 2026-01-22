from datetime import datetime, timedelta
from typing import Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Expense, User, Subscription
from decimal import Decimal
import calendar

class BurnRateForecaster:
    """Predicts if user will run out of money before month ends"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_burn_rate(self, user_id: int, current_balance: Optional[Decimal] = None) -> Dict:
        """
        Calculate daily burn rate and predict month-end balance
        Returns warning if user might run out of money
        """
        today = datetime.now()
        month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        days_elapsed = (today - month_start).days + 1
        
        # Get total spending this month
        month_expenses = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.transaction_date >= month_start
        ).scalar() or Decimal(0)
        
        # Calculate daily burn rate
        daily_burn_rate = month_expenses / days_elapsed if days_elapsed > 0 else Decimal(0)
        
        # Get days remaining in month
        last_day = calendar.monthrange(today.year, today.month)[1]
        days_remaining = last_day - today.day
        
        # Predict remaining spending
        predicted_remaining_spend = daily_burn_rate * days_remaining
        
        # Get upcoming subscriptions
        upcoming_subs = self._get_upcoming_subscriptions(user_id, days_remaining)
        subscription_total = sum(sub.amount for sub in upcoming_subs)
        
        # Total predicted spending
        total_predicted_spend = predicted_remaining_spend + subscription_total
        
        # Calculate projected balance
        projected_balance = (current_balance or Decimal(0)) - total_predicted_spend
        
        # Determine warning level
        warning_level = self._determine_warning_level(
            projected_balance, 
            current_balance or Decimal(0),
            days_remaining
        )
        
        # Calculate days until broke (if applicable)
        days_until_broke = None
        if daily_burn_rate > 0 and current_balance:
            days_until_broke = int(current_balance / daily_burn_rate)
        
        return {
            "daily_burn_rate": float(daily_burn_rate),
            "days_elapsed": days_elapsed,
            "days_remaining": days_remaining,
            "month_spending": float(month_expenses),
            "predicted_remaining_spend": float(predicted_remaining_spend),
            "upcoming_subscriptions": float(subscription_total),
            "total_predicted_spend": float(total_predicted_spend),
            "projected_month_end_balance": float(projected_balance),
            "days_until_broke": days_until_broke,
            "warning_level": warning_level,
            "upcoming_subscription_details": [
                {
                    "merchant": sub.merchant_name,
                    "amount": float(sub.amount),
                    "date": sub.next_payment_date.isoformat()
                }
                for sub in upcoming_subs
            ]
        }
    
    def _get_upcoming_subscriptions(self, user_id: int, days_ahead: int) -> list:
        """Get subscriptions due in the next N days"""
        today = datetime.now().date()
        future_date = today + timedelta(days=days_ahead)
        
        return self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.is_active == True,
            Subscription.next_payment_date >= today,
            Subscription.next_payment_date <= future_date
        ).all()
    
    def _determine_warning_level(
        self, 
        projected_balance: Decimal, 
        current_balance: Decimal,
        days_remaining: int
    ) -> str:
        """Determine warning level based on projected balance"""
        
        if projected_balance < 0:
            return "critical"  # Will run out of money
        
        if current_balance > 0:
            balance_ratio = projected_balance / current_balance
            
            if balance_ratio < 0.2:  # Less than 20% remaining
                return "warning"
            elif balance_ratio < 0.5:  # Less than 50% remaining
                return "caution"
        
        return "safe"
    
    def get_spending_trends(self, user_id: int, months: int = 3) -> Dict:
        """Analyze spending trends over multiple months"""
        today = datetime.now()
        monthly_data = []
        
        for i in range(months):
            # Calculate month boundaries
            month_date = today - timedelta(days=30 * i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            if month_date.month == 12:
                next_month = month_date.replace(year=month_date.year + 1, month=1, day=1)
            else:
                next_month = month_date.replace(month=month_date.month + 1, day=1)
            
            # Get spending for this month
            month_total = self.db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.transaction_date >= month_start,
                Expense.transaction_date < next_month
            ).scalar() or Decimal(0)
            
            monthly_data.append({
                "month": month_start.strftime("%B %Y"),
                "total_spending": float(month_total)
            })
        
        # Calculate average
        avg_spending = sum(m["total_spending"] for m in monthly_data) / len(monthly_data)
        
        return {
            "monthly_breakdown": list(reversed(monthly_data)),
            "average_monthly_spending": avg_spending,
            "trend": "increasing" if monthly_data[0]["total_spending"] > avg_spending else "decreasing"
        }
