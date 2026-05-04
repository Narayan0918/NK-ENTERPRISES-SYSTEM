from django.db import models

class Party(models.Model):
    """
    Stores Party (Customer/Seller) details.
    Normalizes 'GST NO.', 'PARTY NAME', and 'ADDRESS' columns from the sheets.
    """
    business_name = models.CharField(max_length=255)
    address = models.TextField() # Crucial for printed bills, not just summaries
    
    # We increase this to 50 to handle Excel/Manual typos without crashing the app.
    # It still must be unique to represent a single unique entity.
    gst_number = models.CharField(max_length=50, unique=True, db_index=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.business_name} ({self.gst_number})"

class Product(models.Model):
    """
    Stores individual Yarn/Material types.
    Normalizes 'HSN CODE' and 'DESCRIPTION' details.
    """
    name = models.CharField(max_length=255) # e.g., 'Woollen Yarn', 'Nettle Yarn'
    hsn_code = models.CharField(max_length=10, unique=True, db_index=True)
    
    def __str__(self):
        return f"{self.name} (HSN: {self.hsn_code})"

class Invoice(models.Model):
    """
    The main receipt/bill header details.
    Maps exactly to the unique headers in the 'SALE' sheet.
    """
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True) # Maps to 'BILL NO'
    date_of_issue = models.DateField(db_index=True) # Maps to 'DATE'
    
    # Links to the full Party object to prevent duplicating name/address every single deal.
    party = models.ForeignKey(Party, on_delete=models.PROTECT, related_name='invoices')
    
    # --- Aggregated Aggregates from your physical sheet ---
    # Stores the total basic taxable amount of all items on this bill (before tax)
    total_taxable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Individual tax amounts for quick reporting
    cgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    sgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    igst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    
    # Final, tax-inclusive total (Maps to 'G.TOTAL')
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"Bill No: {self.invoice_number} - {self.party.business_name}"

class InvoiceItem(models.Model):
    """
    The individual items/line entries that make up a single Invoice.
    This structure ensures that as an invoice can have unlimited items.
    """
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    
    # --- Item Level Details ---
    
    # ADDED from previous request: Stores bag count like '5/B' or '12/B'
    p_no = models.CharField(max_length=50, blank=True, null=True) 
    
    # Maps directly to 'WIGHT' column in your sheet. Weight of the yarn.
    quantity = models.DecimalField(max_digits=10, decimal_places=2) 
    
    # Essential unlisted field to calculate Amount (Qty * Rate)
    rate = models.DecimalField(max_digits=10, decimal_places=2) 
    
    # Final taxable value of this line item (Maps directly to 'AMOUNT' column in your sheet)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} ({self.quantity}) on Bill No: {self.invoice.invoice_number}"