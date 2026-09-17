import pandas as pd
from datetime import datetime, date, timedelta
from decimal import Decimal

from django.db.models import Sum, Q
from django.db import transaction as db_transaction
from django.http import HttpResponse

from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from .models import (
    UserSettings, Account, Category, Transaction,
    Budget, BudgetCategory, SavingsGoal, GoalContribution,
    Bill, RecurringTransaction, Notification
)
from .serializers import (
    UserSerializer, UserSettingsSerializer, RegisterSerializer,
    AccountSerializer, CategorySerializer, TransactionSerializer,
    BudgetSerializer, BudgetCategorySerializer,
    SavingsGoalSerializer, GoalContributionSerializer,
    BillSerializer, RecurringTransactionSerializer, NotificationSerializer
)

DEFAULT_CATEGORIES = [
    # Expenses
    ('Food & Dining', 'expense', 'Utensils', '#10B981'),
    ('Groceries', 'expense', 'ShoppingCart', '#059669'),
    ('Transport & Fuel', 'expense', 'Car', '#3B82F6'),
    ('Housing & Rent', 'expense', 'Home', '#6366F1'),
    ('Bills & Utilities', 'expense', 'FileText', '#8B5CF6'),
    ('Shopping', 'expense', 'ShoppingBag', '#EC4899'),
    ('Entertainment', 'expense', 'Film', '#F43F5E'),
    ('Education', 'expense', 'BookOpen', '#14B8A6'),
    ('Healthcare', 'expense', 'Activity', '#EF4444'),
    ('Travel', 'expense', 'Plane', '#F59E0B'),
    ('Subscriptions', 'expense', 'Tv', '#84CC16'),
    ('Personal Care', 'expense', 'User', '#06B6D4'),
    ('Other Expense', 'expense', 'MoreHorizontal', '#64748B'),
    # Income
    ('Salary', 'income', 'DollarSign', '#10B981'),
    ('Freelance', 'income', 'Briefcase', '#3B82F6'),
    ('Business', 'income', 'TrendingUp', '#8B5CF6'),
    ('Investment & Interest', 'income', 'PieChart', '#F59E0B'),
    ('Gift & Allowance', 'income', 'Gift', '#EC4899'),
    ('Scholarship', 'income', 'Award', '#14B8A6'),
    ('Other Income', 'income', 'PlusCircle', '#64748B'),
]

def seed_user_default_categories(user):
    if not Category.objects.filter(user=user).exists():
        for name, c_type, icon, color in DEFAULT_CATEGORIES:
            Category.objects.create(
                user=user,
                name=name,
                category_type=c_type,
                icon=icon,
                color=color,
                is_custom=False
            )

def update_account_balances_for_user(user):
    accounts = Account.objects.filter(user=user)
    for account in accounts:
        balance = account.initial_balance
        # Add Income
        income_sum = Transaction.objects.filter(
            user=user, account=account, transaction_type='income'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        balance += income_sum

        # Subtract Expense
        expense_sum = Transaction.objects.filter(
            user=user, account=account, transaction_type='expense'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        balance -= expense_sum

        # Transfers OUT
        trans_out = Transaction.objects.filter(
            user=user, account=account, transaction_type='transfer'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        balance -= trans_out

        # Transfers IN
        trans_in = Transaction.objects.filter(
            user=user, to_account=account, transaction_type='transfer'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        balance += trans_in

        # Goal Contributions OUT
        goal_contribs = GoalContribution.objects.filter(
            user=user, from_account=account
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        balance -= goal_contribs

        account.current_balance = balance
        account.save()

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        seed_user_default_categories(user)
        # Create initial default accounts
        Account.objects.create(user=user, name="HDFC Bank", account_type="bank", initial_balance=Decimal('35000.00'), current_balance=Decimal('35000.00'))
        Account.objects.create(user=user, name="Savings Account", account_type="savings", initial_balance=Decimal('10000.00'), current_balance=Decimal('10000.00'))
        Account.objects.create(user=user, name="Cash", account_type="cash", initial_balance=Decimal('2500.00'), current_balance=Decimal('2500.00'))
        Account.objects.create(user=user, name="UPI Wallet", account_type="upi", initial_balance=Decimal('3200.00'), current_balance=Decimal('3200.00'))
        update_account_balances_for_user(user)

class UserProfileView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        try:
            settings_obj = request.user.settings
            settings_data = UserSettingsSerializer(settings_obj).data
        except UserSettings.DoesNotExist:
            settings_obj = UserSettings.objects.create(user=request.user)
            settings_data = UserSettingsSerializer(settings_obj).data
        return Response({
            'user': serializer.data,
            'settings': settings_data
        })

class UserSettingsView(APIView):
    def put(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer

    def get_queryset(self):
        update_account_balances_for_user(self.request.user)
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        account = serializer.save(user=self.request.user, current_balance=serializer.validated_data.get('initial_balance', Decimal('0.00')))
        update_account_balances_for_user(self.request.user)

    def perform_update(self, serializer):
        serializer.save()
        update_account_balances_for_user(self.request.user)

    def perform_destroy(self, instance):
        instance.delete()
        update_account_balances_for_user(self.request.user)

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        seed_user_default_categories(self.request.user)
        return Category.objects.filter(Q(user=self.request.user) | Q(user__isnull=True))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, is_custom=True)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user).order_by('-date', '-created_at')
        t_type = self.request.query_params.get('type')
        category_id = self.request.query_params.get('category')
        account_id = self.request.query_params.get('account')
        search_query = self.request.query_params.get('search')
        is_need = self.request.query_params.get('is_need')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if t_type:
            queryset = queryset.filter(transaction_type=t_type)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if account_id:
            queryset = queryset.filter(Q(account_id=account_id) | Q(to_account_id=account_id))
        if is_need is not None:
            if is_need.lower() == 'true':
                queryset = queryset.filter(is_need=True)
            elif is_need.lower() == 'false':
                queryset = queryset.filter(is_need=False)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if search_query:
            queryset = queryset.filter(
                Q(description__icontains=search_query) |
                Q(merchant__icontains=search_query) |
                Q(category__name__icontains=search_query) |
                Q(notes__icontains=search_query)
            )
        return queryset

    def perform_create(self, serializer):
        with db_transaction.atomic():
            tx = serializer.save(user=self.request.user)
            update_account_balances_for_user(self.request.user)
            self._check_budget_alerts(tx)

    def perform_update(self, serializer):
        with db_transaction.atomic():
            tx = serializer.save()
            update_account_balances_for_user(self.request.user)
            self._check_budget_alerts(tx)

    def perform_destroy(self, instance):
        with db_transaction.atomic():
            instance.delete()
            update_account_balances_for_user(self.request.user)

    def _check_budget_alerts(self, tx):
        if tx.transaction_type == 'expense' and tx.date:
            m = tx.date.month
            y = tx.date.year
            try:
                budget = Budget.objects.get(user=tx.user, month=m, year=y)
                total_spent = Transaction.objects.filter(
                    user=tx.user, transaction_type='expense', date__year=y, date__month=m
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

                if budget.total_amount > 0:
                    ratio = (total_spent / budget.total_amount) * 100
                    if ratio >= 100:
                        Notification.objects.create(
                            user=tx.user,
                            title="🔴 Budget Exceeded!",
                            message=f"You have spent {total_spent} which exceeds your monthly budget of {budget.total_amount}.",
                            notification_type="budget_exceeded"
                        )
                    elif ratio >= 80:
                        Notification.objects.create(
                            user=tx.user,
                            title="⚠️ Budget Warning (80% Used)",
                            message=f"You have reached {round(ratio, 1)}% of your overall monthly budget ({total_spent}/{budget.total_amount}).",
                            notification_type="budget_warning"
                        )
            except Budget.DoesNotExist:
                pass

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).order_by('-year', '-month')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BudgetCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetCategorySerializer

    def get_queryset(self):
        budget_id = self.request.query_params.get('budget')
        if budget_id:
            return BudgetCategory.objects.filter(budget__id=budget_id, budget__user=self.request.user)
        return BudgetCategory.objects.filter(budget__user=self.request.user)

class SavingsGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsGoalSerializer

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user).order_by('target_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_contribution(self, request, pk=None):
        goal = self.get_object()
        amount_str = request.data.get('amount')
        account_id = request.data.get('from_account')
        notes = request.data.get('notes', '')
        contrib_date = request.data.get('date', date.today().isoformat())

        if not amount_str or not account_id:
            return Response({"error": "Amount and from_account are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount_str))
            if amount <= 0:
                return Response({"error": "Amount must be positive."}, status=status.HTTP_400_BAD_REQUEST)
            account = Account.objects.get(id=account_id, user=request.user)
        except (ValueError, Account.DoesNotExist):
            return Response({"error": "Invalid amount or account."}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            GoalContribution.objects.create(
                goal=goal,
                user=request.user,
                amount=amount,
                from_account=account,
                date=contrib_date,
                notes=notes
            )
            goal.current_amount += amount
            goal.save()

            # Create an expense / goal allocation transaction record for tracking history
            cat, _ = Category.objects.get_or_create(user=request.user, name="Savings Goal Contribution", category_type="expense")
            Transaction.objects.create(
                user=request.user,
                transaction_type="expense",
                amount=amount,
                category=cat,
                description=f"Contribution to {goal.name}",
                date=contrib_date,
                account=account,
                payment_method="Transfer",
                is_need=True,
                notes=f"Saved for goal: {goal.name}"
            )
            update_account_balances_for_user(request.user)

            if goal.current_amount >= goal.target_amount:
                Notification.objects.create(
                    user=request.user,
                    title="🎯 Goal Achieved!",
                    message=f"Congratulations! You have reached your target savings goal of {goal.name} ({goal.target_amount})!",
                    notification_type="goal_milestone"
                )

        return Response(SavingsGoalSerializer(goal).data, status=status.HTTP_200_OK)

class BillViewSet(viewsets.ModelViewSet):
    serializer_class = BillSerializer

    def get_queryset(self):
        # Auto update overdue status
        today = date.today()
        bills = Bill.objects.filter(user=self.request.user)
        for b in bills:
            if b.status == 'upcoming' and b.due_date < today:
                b.status = 'overdue'
                b.save()
        return Bill.objects.filter(user=self.request.user).order_by('due_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        bill = self.get_object()
        account_id = request.data.get('account')
        pay_date = request.data.get('date', date.today().isoformat())

        if bill.status == 'paid':
            return Response({"message": "Bill is already paid."}, status=status.HTTP_200_OK)

        account = None
        if account_id:
            try:
                account = Account.objects.get(id=account_id, user=request.user)
            except Account.DoesNotExist:
                pass
        if not account and bill.account:
            account = bill.account
        if not account:
            account = Account.objects.filter(user=request.user).first()

        with db_transaction.atomic():
            bill.status = 'paid'
            bill.save()

            if account:
                tx_cat = bill.category
                if not tx_cat:
                    tx_cat, _ = Category.objects.get_or_create(user=request.user, name="Bills & Utilities", category_type="expense")
                Transaction.objects.create(
                    user=request.user,
                    transaction_type="expense",
                    amount=bill.amount,
                    category=tx_cat,
                    description=f"Bill Paid: {bill.name}",
                    date=pay_date,
                    account=account,
                    payment_method="Online",
                    is_need=True,
                    notes=f"Paid bill {bill.name}"
                )
                update_account_balances_for_user(request.user)

        return Response(BillSerializer(bill).data)

class RecurringTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = RecurringTransactionSerializer

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user).order_by('next_occurrence')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def process_due(self, request):
        today = date.today()
        recurring_list = RecurringTransaction.objects.filter(
            user=request.user, is_active=True, next_occurrence__lte=today
        )
        created_count = 0
        with db_transaction.atomic():
            for rec in recurring_list:
                # Avoid duplicate generation on same date
                if rec.last_executed == rec.next_occurrence:
                    continue

                Transaction.objects.create(
                    user=request.user,
                    transaction_type=rec.transaction_type,
                    amount=rec.amount,
                    category=rec.category,
                    description=f"[Recurring] {rec.title}",
                    date=rec.next_occurrence,
                    account=rec.account,
                    payment_method="Auto-Debit",
                    is_need=True,
                    notes=f"Generated from recurring setup #{rec.id}"
                )
                created_count += 1
                rec.last_executed = rec.next_occurrence

                # Advance next_occurrence
                if rec.frequency == 'daily':
                    rec.next_occurrence += timedelta(days=1)
                elif rec.frequency == 'weekly':
                    rec.next_occurrence += timedelta(weeks=1)
                elif rec.frequency == 'monthly':
                    m = rec.next_occurrence.month % 12 + 1
                    y = rec.next_occurrence.year + (1 if m == 1 else 0)
                    try:
                        rec.next_occurrence = rec.next_occurrence.replace(year=y, month=m)
                    except ValueError:
                        rec.next_occurrence += timedelta(days=30)
                elif rec.frequency == 'yearly':
                    rec.next_occurrence = rec.next_occurrence.replace(year=rec.next_occurrence.year + 1)

                if rec.end_date and rec.next_occurrence > rec.end_date:
                    rec.is_active = False
                rec.save()

            if created_count > 0:
                update_account_balances_for_user(request.user)
                Notification.objects.create(
                    user=request.user,
                    title="🔄 Recurring Transactions Processed",
                    message=f"{created_count} due recurring transaction(s) have been posted automatically.",
                    notification_type="recurring_processed"
                )

        return Response({"message": f"Processed {created_count} recurring transaction(s)."}, status=status.HTTP_200_OK)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."})

class AnalyticsSummaryView(APIView):
    def get(self, request):
        user = request.user
        update_account_balances_for_user(user)

        period = request.query_params.get('period', 'this_month')
        start_date_param = request.query_params.get('start_date')
        end_date_param = request.query_params.get('end_date')

        today = date.today()

        if period == 'this_month':
            start_date = today.replace(day=1)
            end_date = today
        elif period == 'last_month':
            first_of_this_month = today.replace(day=1)
            end_date = first_of_this_month - timedelta(days=1)
            start_date = end_date.replace(day=1)
        elif period == 'last_3_months':
            start_date = today - timedelta(days=90)
            end_date = today
        elif period == 'last_6_months':
            start_date = today - timedelta(days=180)
            end_date = today
        elif period == 'this_year':
            start_date = today.replace(month=1, day=1)
            end_date = today
        elif period == 'custom' and start_date_param and end_date_param:
            try:
                start_date = datetime.strptime(start_date_param, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_param, '%Y-%m-%d').date()
            except ValueError:
                start_date = today.replace(day=1)
                end_date = today
        else:
            start_date = today.replace(day=1)
            end_date = today

        # Fetch transactions for period
        tx_qs = Transaction.objects.filter(user=user, date__gte=start_date, date__lte=end_date)
        all_user_tx = Transaction.objects.filter(user=user)

        # Accounts total balance
        accounts = Account.objects.filter(user=user)
        total_balance = sum(acc.current_balance for acc in accounts)

        # Totals in period
        income_sum = tx_qs.filter(transaction_type='income').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        expense_sum = tx_qs.filter(transaction_type='expense').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        savings_sum = income_sum - expense_sum

        # Overall lifetime totals
        total_income_lifetime = all_user_tx.filter(transaction_type='income').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_expense_lifetime = all_user_tx.filter(transaction_type='expense').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Pandas dataframe construction for high-performance aggregations
        tx_data = list(tx_qs.values(
            'id', 'transaction_type', 'amount', 'date',
            'category__name', 'category__color', 'is_need', 'account__name', 'payment_method'
        ))

        daily_spending = []
        category_breakdown = []
        need_vs_want = {'need': 0.0, 'want': 0.0, 'need_pct': 0.0, 'want_pct': 0.0}
        account_spending = []
        payment_method_spending = []

        if tx_data:
            df = pd.DataFrame(tx_data)
            df['amount'] = df['amount'].astype(float)
            df['date'] = pd.to_datetime(df['date'])

            # Expenses dataframe
            exp_df = df[df['transaction_type'] == 'expense']

            if not exp_df.empty:
                # Daily spending
                daily_df = exp_df.groupby(exp_df['date'].dt.strftime('%Y-%m-%d'))['amount'].sum().reset_index()
                daily_spending = daily_df.rename(columns={'date': 'date', 'amount': 'spending'}).to_dict(orient='records')

                # Category breakdown
                cat_df = exp_df.groupby(['category__name', 'category__color'])['amount'].sum().reset_index()
                cat_df.rename(columns={'category__name': 'name', 'category__color': 'color', 'amount': 'value'}, inplace=True)
                category_breakdown = cat_df.to_dict(orient='records')

                # Need vs Want
                need_sum = float(exp_df[exp_df['is_need'] == True]['amount'].sum())
                want_sum = float(exp_df[exp_df['is_need'] == False]['amount'].sum())
                tot_nw = need_sum + want_sum
                need_pct = round((need_sum / tot_nw * 100), 1) if tot_nw > 0 else 0
                want_pct = round((want_sum / tot_nw * 100), 1) if tot_nw > 0 else 0
                need_vs_want = {
                    'need': need_sum,
                    'want': want_sum,
                    'need_pct': need_pct,
                    'want_pct': want_pct
                }

                # Account spending
                acc_df = exp_df.groupby('account__name')['amount'].sum().reset_index()
                acc_df.rename(columns={'account__name': 'name', 'amount': 'value'}, inplace=True)
                account_spending = acc_df.to_dict(orient='records')

                # Payment method spending
                pm_df = exp_df.groupby('payment_method')['amount'].sum().reset_index()
                pm_df.rename(columns={'payment_method': 'name', 'amount': 'value'}, inplace=True)
                payment_method_spending = pm_df.to_dict(orient='records')

        # Generate Data-Driven Insights
        insights = []
        if float(expense_sum) > 0:
            avg_daily = round(float(expense_sum) / max((end_date - start_date).days + 1, 1), 2)
            insights.append(f"Your average daily spending in this period is ₹{avg_daily:,.2f}.")

        if category_breakdown:
            top_cat = max(category_breakdown, key=lambda x: x['value'])
            insights.append(f"'{top_cat['name']}' is your highest spending category at ₹{top_cat['value']:,.2f}.")

        if need_vs_want['want_pct'] > 40:
            insights.append(f"Wants account for {need_vs_want['want_pct']}% of expenses. Consider scaling back non-essential spending.")

        # Budget Check
        try:
            cur_budget = Budget.objects.get(user=user, month=today.month, year=today.year)
            cur_spent = Transaction.objects.filter(
                user=user, transaction_type='expense', date__year=today.year, date__month=today.month
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            b_pct = round(float(cur_spent / cur_budget.total_amount * 100), 1) if cur_budget.total_amount > 0 else 0
            if b_pct >= 100:
                insights.append(f"🔴 You have exceeded your monthly budget of ₹{cur_budget.total_amount:,.2f} ({b_pct}% used).")
            elif b_pct >= 80:
                insights.append(f"⚠️ You have used {b_pct}% of your monthly budget of ₹{cur_budget.total_amount:,.2f}.")
        except Budget.DoesNotExist:
            insights.append("No active monthly budget set for this month. Set a budget to track spending limits!")

        return Response({
            'summary': {
                'total_balance': float(total_balance),
                'income': float(income_sum),
                'expenses': float(expense_sum),
                'savings': float(savings_sum),
                'total_income_lifetime': float(total_income_lifetime),
                'total_expense_lifetime': float(total_expense_lifetime),
                'period': period,
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
            },
            'charts': {
                'daily_spending': daily_spending,
                'category_breakdown': category_breakdown,
                'need_vs_want': need_vs_want,
                'account_spending': account_spending,
                'payment_method_spending': payment_method_spending,
            },
            'insights': insights
        })

class ReportsExportView(APIView):
    def get(self, request):
        user = request.user
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        tx_qs = Transaction.objects.filter(user=user).order_by('-date')
        if start_date:
            tx_qs = tx_qs.filter(date__gte=start_date)
        if end_date:
            tx_qs = tx_qs.filter(date__lte=end_date)

        data = list(tx_qs.values(
            'id', 'date', 'transaction_type', 'amount', 'category__name',
            'description', 'merchant', 'account__name', 'payment_method', 'is_need', 'notes'
        ))

        df = pd.DataFrame(data)
        if df.empty:
            df = pd.DataFrame(columns=['id', 'date', 'transaction_type', 'amount', 'category__name', 'description', 'merchant', 'account__name', 'payment_method', 'is_need', 'notes'])

        df.rename(columns={
            'category__name': 'category',
            'account__name': 'account',
            'is_need': 'need_vs_want'
        }, inplace=True)

        if 'need_vs_want' in df.columns:
            df['need_vs_want'] = df['need_vs_want'].apply(lambda x: 'Need' if x is True else 'Want')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="financial_report_{date.today().strftime("%Y%m%d")}.csv"'
        df.to_csv(path_or_buf=response, index=False)
        return response
