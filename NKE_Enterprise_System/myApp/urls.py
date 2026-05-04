from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PartyViewSet, ProductViewSet, InvoiceViewSet

# The router automatically generates all standard REST API routes for CRUD
router = DefaultRouter()
router.register(r'parties', PartyViewSet, basename='party')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
]