import os
import sys
import django
from decimal import Decimal
from datetime import date, timedelta, datetime

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finance_project.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import (
    Account, Category, Transaction, Budget, BudgetCategory,
    SavingsGoal, GoalContribution, Bill, RecurringTransaction, Notification, UserSettings
)
from api.views import seed_user_default_categories, update_account_balances_for_user

def run_seed():
    print("Seeding database with sample demo data...")

    # Create demo user
    username = 'demo_user'
    email = 'demo@finance.app'
    password = 'password123'

    user, created = User.objects.get_or_create(username=username, defaults={'email': email, 'first_name': 'Madhu', 'last_name': 'K'})
    if created:
        user.set_password(password)
        user.save()
        print(f"Created demo user: {username} (password: {password})")
    else:
        print(f"Demo user '{username}' already exists.")

    UserSettings.objects.get_or_create(user=user, defaults={'currency': 'INR', 'currency_symbol': '₹', 'timezone': 'Asia/Kolkata'})
    seed_user_default_categories(user)

    # Accounts
    acc_hdfc, _ = Account.objects.get_or_create(user=user, name="HDFC Bank", account_type="bank", defaults={'initial_balance': Decimal('35000.00'), 'current_balance': Decimal('35000.00')})
    acc_sav, _ = Account.objects.get_or_create(user=user, name="Savings Account", account_type="savings", defaults={'initial_balance': Decimal('10000.00'), 'current_balance': Decimal('10000.00')})
    acc_cash, _ = Account.objects.get_or_create(user=user, name="Cash", account_type="cash", defaults={'initial_balance': Decimal('2500.00'), 'current_balance': Decimal('2500.00')})
    acc_upi, _ = Account.objects.get_or_create(user=user, name="UPI Wallet", account_type="upi", defaults={'initial_balance': Decimal('3200.00'), 'current_balance': Decimal('3200.00')})
    acc_cc, _ = Account.objects.get_or_create(user=user, name="HDFC Credit Card", account_type="credit_card", defaults={'initial_balance': Decimal('-4000.00'), 'current_balance': Decimal('-4000.00')})

    # Categories
    cat_food = Category.objects.filter(user=user, name="Food & Dining").first()
    cat_groc = Category.objects.filter(user=user, name="Groceries").first()
    cat_trans = Category.objects.filter(user=user, name="Transport & Fuel").first()
    cat_house = Category.objects.filter(user=user, name="Housing & Rent").first()
    cat_bills = Category.objects.filter(user=user, name="Bills & Utilities").first()
    cat_shop = Category.objects.filter(user=user, name="Shopping").first()
    cat_ent = Category.objects.filter(user=user, name="Entertainment").first()
    cat_sal = Category.objects.filter(user=user, name="Salary").first()
    cat_free = Category.objects.filter(user=user, name="Freelance").first()

    today = date.today()

    # Clear existing transactions for fresh demo
    Transaction.objects.filter(user=user).delete()

    # Income transactions
    Transaction.objects.create(
        user=user, transaction_type="income", amount=Decimal('60000.00'),
        category=cat_sal, description="Monthly Salary September", date=today.replace(day=1),
        account=acc_hdfc, payment_method="Net Banking", is_need=True, notes="Base salary credited"
    )
    Transaction.objects.create(
        user=user, transaction_type="income", amount=Decimal('8500.00'),
        category=cat_free, description="Web Development Freelance", date=today - timedelta(days=5),
        account=acc_upi, payment_method="UPI", is_need=True, notes="Client UI design payout"
    )

    # Expenses in current month
    txs = [
        (Decimal('1250.00'), cat_food, "Swiggy Gourmet Dinner", "Swiggy", today - timedelta(days=1), acc_upi, "UPI", False),
        (Decimal('3400.00'), cat_groc, "Supermarket Monthly Provisions", "D-Mart", today - timedelta(days=2), acc_hdfc, "Debit Card", True),
        (Decimal('850.00'), cat_trans, "Fuel station petrol fill", "Shell", today - timedelta(days=3), acc_hdfc, "Debit Card", True),
        (Decimal('12000.00'), cat_house, "House Rent Payment", "Landlord", today.replace(day=1), acc_hdfc, "Net Banking", True),
        (Decimal('799.00'), cat_bills, "Airtel Fiber Broadband", "Airtel", today - timedelta(days=4), acc_upi, "UPI", True),
        (Decimal('2499.00'), cat_shop, "Nike Running Shoes Sale", "Nike", today - timedelta(days=6), acc_cc, "Credit Card", False),
        (Decimal('649.00'), cat_ent, "Netflix Premium 4K", "Netflix", today - timedelta(days=7), acc_cc, "Credit Card", False),
    ]

    for amt, cat, desc, merch, d, acc, pm, need in txs:
        Transaction.objects.create(
            user=user, transaction_type="expense", amount=amt,
            category=cat, description=desc, merchant=merch, date=d,
            account=acc, payment_method=pm, is_need=need
        )

    # Transfer
    Transaction.objects.create(
        user=user, transaction_type="transfer", amount=Decimal('5000.00'),
        description="Transfer to Savings for Emergency Reserve", date=today - timedelta(days=3),
        account=acc_hdfc, to_account=acc_sav, payment_method="Net Banking"
    )

    # Monthly Budget
    budget, _ = Budget.objects.get_or_create(user=user, month=today.month, year=today.year, defaults={'total_amount': Decimal('25000.00')})
    budget.total_amount = Decimal('25000.00')
    budget.save()

    if cat_food:
        BudgetCategory.objects.get_or_create(budget=budget, category=cat_food, defaults={'allocated_amount': Decimal('5000.00')})
    if cat_trans:
        BudgetCategory.objects.get_or_create(budget=budget, category=cat_trans, defaults={'allocated_amount': Decimal('3000.00')})
    if cat_shop:
        BudgetCategory.objects.get_or_create(budget=budget, category=cat_shop, defaults={'allocated_amount': Decimal('4000.00')})

    # Savings Goals
    goal_laptop, _ = SavingsGoal.objects.get_or_create(
        user=user, name="New MacBook Pro",
        defaults={
            'goal_type': 'laptop',
            'target_amount': Decimal('60000.00'),
            'current_amount': Decimal('25000.00'),
            'target_date': date(today.year, 12, 31),
            'priority': 'high',
            'description': 'M3 Pro Laptop for development work'
        }
    )

    goal_trip, _ = SavingsGoal.objects.get_or_create(
        user=user, name="Goa Vacation",
        defaults={
            'goal_type': 'trip',
            'target_amount': Decimal('30000.00'),
            'current_amount': Decimal('12000.00'),
            'target_date': date(today.year, 11, 15),
            'priority': 'medium',
            'description': 'Year end holiday trip with friends'
        }
    )

    # Bills
    Bill.objects.get_or_create(user=user, name="Electricity Bill", defaults={'amount': Decimal('1850.00'), 'due_date': today + timedelta(days=5), 'status': 'upcoming', 'account': acc_hdfc, 'category': cat_bills})
    Bill.objects.get_or_create(user=user, name="Jio Mobile Recharge", defaults={'amount': Decimal('299.00'), 'due_date': today - timedelta(days=2), 'status': 'overdue', 'account': acc_upi, 'category': cat_bills})

    # Recurring Transactions
    RecurringTransaction.objects.get_or_create(
        user=user, title="House Rent",
        defaults={
            'transaction_type': 'expense',
            'amount': Decimal('12000.00'),
            'frequency': 'monthly',
            'start_date': today.replace(day=1),
            'next_occurrence': today.replace(day=1) + timedelta(days=30),
            'account': acc_hdfc,
            'category': cat_house
        }
    )

    # Update account balance aggregations
    update_account_balances_for_user(user)

    # Notifications
    Notification.objects.get_or_create(
        user=user, title="⚠️ Bill Overdue Alert",
        defaults={'message': 'Your Jio Mobile Recharge of ₹299.00 was due 2 days ago.', 'notification_type': 'bill_overdue'}
    )
    Notification.objects.get_or_create(
        user=user, title="💡 Saving Rate On Track",
        defaults={'message': 'You have saved 41.67% of your MacBook Pro goal target.', 'notification_type': 'info'}
    )

    print("Successfully seeded demo database!")

if __name__ == '__main__':
    run_seed()
