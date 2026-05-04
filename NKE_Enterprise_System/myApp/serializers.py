from rest_framework import serializers
from django.db import transaction
from .models import Party, Product, Invoice, InvoiceItem

class PartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class InvoiceItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = InvoiceItem
        fields = ['id', 'product', 'product_details', 'quantity', 'rate', 'amount']
        # Do not require ID for items, as we might be creating new ones during an update
        extra_kwargs = {'id': {'read_only': True}} 

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    party_details = PartySerializer(source='party', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'date_of_issue', 'party', 'party_details', 
            'total_taxable_amount', 'cgst_amount', 'sgst_amount', 'igst_amount', 
            'grand_total', 'items'
        ]

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        return invoice

    @transaction.atomic
    def update(self, instance, validated_data):
        # Extract items data
        items_data = validated_data.pop('items', None)
        
        # Update main Invoice fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If items are provided in the update, replace the old ones
        if items_data is not None:
            # Delete existing items
            instance.items.all().delete()
            # Create the newly provided items
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)

        return instance