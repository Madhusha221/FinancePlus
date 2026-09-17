from rest_framework import serializers
from django.contrib.auth.models import User
from decimal import Decimal
from .models import (
    UserSettings, Account, Category, Transaction,
    Budget, BudgetCategory, SavingsGoal, GoalContribution,
    Bill, RecurringTransaction, Notification
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = '__all__'
        read_only_fields = ['user']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class AccountSerializer(serializers.ModelSerializer):
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)

    class Meta:
        model = Account
        fields = '__all__'
        read_only_fields = ['user', 'current_balance']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['user']

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    to_account_name = serializers.CharField(source='to_account.name', read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['user']

    def validate(self, attrs):
        t_type = attrs.get('transaction_type')
        if t_type == 'transfer' and not attrs.get('to_account'):
            raise serializers.ValidationError({"to_account": "Destination account is required for transfers."})
        if t_type == 'transfer' and attrs.get('account') == attrs.get('to_account'):
            raise serializers.ValidationError({"to_account": "Source and Destination accounts cannot be the same."})
        if attrs.get('amount', 0) <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than zero."})
        return attrs

class BudgetCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    spent_amount = serializers.SerializerMethodField()

    class Meta:
        model = BudgetCategory
        fields = '__all__'
        read_only_fields = ['budget']

    def get_spent_amount(self, obj):
        from django.db.models import Sum
        user = obj.budget.user
        month = obj.budget.month
        year = obj.budget.year
        spent = Transaction.objects.filter(
            user=user,
            category=obj.category,
            transaction_type='expense',
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0
        return float(spent)

class BudgetSerializer(serializers.ModelSerializer):
    category_budgets = BudgetCategorySerializer(many=True, read_only=True)
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ['user']

    def get_total_spent(self, obj):
        from django.db.models import Sum
        spent = Transaction.objects.filter(
            user=obj.user,
            transaction_type='expense',
            date__year=obj.year,
            date__month=obj.month
        ).aggregate(total=Sum('amount'))['total'] or 0
        return float(spent)

class GoalContributionSerializer(serializers.ModelSerializer):
    from_account_name = serializers.CharField(source='from_account.name', read_only=True)

    class Meta:
        model = GoalContribution
        fields = '__all__'
        read_only_fields = ['user']

class SavingsGoalSerializer(serializers.ModelSerializer):
    contributions = GoalContributionSerializer(many=True, read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    required_monthly_savings = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = SavingsGoal
        fields = '__all__'
        read_only_fields = ['user', 'current_amount']

    def get_progress_percentage(self, obj):
        if obj.target_amount <= 0:
            return 0
        val = (obj.current_amount / obj.target_amount) * 100
        return min(round(float(val), 2), 100.0)

    def get_remaining_amount(self, obj):
        rem = obj.target_amount - obj.current_amount
        return max(float(rem), 0.0)

    def get_days_remaining(self, obj):
        from datetime import date
        today = date.today()
        if obj.target_date <= today:
            return 0
        return (obj.target_date - today).days

    def get_required_monthly_savings(self, obj):
        from datetime import date
        today = date.today()
        rem = obj.target_amount - obj.current_amount
        if rem <= 0 or obj.target_date <= today:
            return 0.0
        days = (obj.target_date - today).days
        months = days / 30.44
        if months <= 0:
            return float(rem)
        return round(float(rem / Decimal(str(months))), 2)

class BillSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Bill
        fields = '__all__'
        read_only_fields = ['user']

class RecurringTransactionSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = RecurringTransaction
        fields = '__all__'
        read_only_fields = ['user']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user']
