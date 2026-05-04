from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Party, Product, Invoice
from .serializers import PartySerializer, ProductSerializer, InvoiceSerializer

class PartyViewSet(viewsets.ModelViewSet):
    queryset = Party.objects.all()
    serializer_class = PartySerializer
    # Allow frontend to search parties by name or GST number
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['business_name', 'gst_number']
    ordering_fields = ['business_name']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name', 'hsn_code']

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().select_related('party').prefetch_related('items__product')
    serializer_class = InvoiceSerializer
    
    # Allow filtering invoices by party, and searching by invoice number
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['party'] # Allows URL: /api/invoices/?party=1
    search_fields = ['invoice_number']
    ordering_fields = ['date_of_issue', 'grand_total']
    ordering = ['-date_of_issue'] # Default order: newest first