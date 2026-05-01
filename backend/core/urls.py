from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from merchants.views import MerchantListView, MerchantBalanceView, MerchantLedgerView, MerchantBankAccountsView
from payouts.views import PayoutCreateView, PayoutListView

urlpatterns = [
    path('', lambda request: JsonResponse({'status': 'ok'})),
    path('admin/', admin.site.urls),
    path('api/v1/merchants/', MerchantListView.as_view()),
    path('api/v1/merchants/<uuid:merchant_id>/balance/', MerchantBalanceView.as_view()),
    path('api/v1/merchants/<uuid:merchant_id>/ledger/', MerchantLedgerView.as_view()),
    path('api/v1/merchants/<uuid:merchant_id>/bank-accounts/', MerchantBankAccountsView.as_view()),
    path('api/v1/merchants/<uuid:merchant_id>/payouts/', PayoutCreateView.as_view()),
    path('api/v1/merchants/<uuid:merchant_id>/payouts/list/', PayoutListView.as_view()),
]
