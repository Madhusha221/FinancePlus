from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView, UserProfileView, UserSettingsView,
    AccountViewSet, CategoryViewSet, TransactionViewSet,
    BudgetViewSet, BudgetCategoryViewSet, SavingsGoalViewSet,
    BillViewSet, RecurringTransactionViewSet, NotificationViewSet,
    AnalyticsSummaryView, ReportsExportView
)

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'budget-categories', BudgetCategoryViewSet, basename='budget-category')
router.register(r'goals', SavingsGoalViewSet, basename='savings-goal')
router.register(r'bills', BillViewSet, basename='bill')
router.register(r'recurring', RecurringTransactionViewSet, basename='recurring-transaction')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='auth_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/profile/', UserProfileView.as_view(), name='auth_profile'),
    path('auth/settings/', UserSettingsView.as_view(), name='auth_settings'),

    # Analytics & Reports
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics_summary'),
    path('reports/export/', ReportsExportView.as_view(), name='reports_export'),

    # ViewSet routes
    path('', include(router.urls)),
]
