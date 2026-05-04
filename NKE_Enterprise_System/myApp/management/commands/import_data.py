import os
import pandas as pd
from datetime import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from myApp.models import Party, Product, Invoice, InvoiceItem

class Command(BaseCommand):
    help = 'Bulk imports data, intelligently handling multiple items per invoice'

    def handle(self, *args, **kwargs):
        base_dir = os.getcwd()
        gst_file = os.path.join(base_dir, 'GST LIST.xlsx')
        hsn_file = os.path.join(base_dir, 'HSN CODE.xlsx')
        
        # NOTE: Make sure this matches the EXACT name of your updated sales sheet
        sales_file = os.path.join(base_dir, '1 MONTH SALE.xlsx') 

        self.stdout.write("Starting data import...")

        with transaction.atomic():
            # 1. IMPORT PARTIES
            self.stdout.write("Importing Parties...")
            gst_df = pd.read_excel(gst_file)
            for index, row in gst_df.iterrows():
                gst_num = str(row['GST Number']).strip()
                if gst_num and gst_num != 'nan':
                    Party.objects.get_or_create(
                        gst_number=gst_num,
                        defaults={
                            'business_name': str(row['Business Name']).strip(),
                            'address': str(row.get('ADDRESS', '')).strip()
                        }
                    )

            # 2. IMPORT PRODUCTS
            self.stdout.write("Importing Products...")
            hsn_df = pd.read_excel(hsn_file)
            for index, row in hsn_df.iterrows():
                hsn_code = str(row['HSN CODE']).replace('.0', '').strip()
                if hsn_code and hsn_code != 'nan':
                    Product.objects.get_or_create(
                        hsn_code=hsn_code,
                        defaults={'name': str(row['Yarn Type']).strip().title()}
                    )

            # 3. IMPORT INVOICES (Intelligently grouping items & summing totals)
            self.stdout.write("Importing Invoices...")
            sales_df = pd.read_excel(sales_file)
            
            sales_df['C.GST'] = sales_df['C.GST'].fillna(0)
            sales_df['S.GST'] = sales_df['S.GST'].fillna(0)
            sales_df['I.GST'] = sales_df['I.GST'].fillna(0)

            for index, row in sales_df.iterrows():
                gst_num = str(row['GST NO.']).strip()
                if gst_num == 'nan': continue

                try:
                    party = Party.objects.get(gst_number=gst_num)
                except Party.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Party missing for GST: {gst_num}. Skipping row."))
                    continue

                hsn_code = str(row['HSN CODE']).replace('.0', '').strip()
                try:
                    product = Product.objects.get(hsn_code=hsn_code)
                except Product.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Product missing for HSN: {hsn_code}. Skipping row."))
                    continue

                inv_number = str(int(row['BILL NO']))
                
                try:
                    date_obj = datetime.strptime(str(row['DATE']), '%d.%m.%Y').date()
                except ValueError:
                    date_obj = datetime.strptime(str(row['DATE']), '%Y-%m-%d %H:%M:%S').date()

                # SMART LOGIC UPGRADE:
                # Set all financial defaults to ZERO when creating the invoice initially
                invoice, created = Invoice.objects.get_or_create(
                    invoice_number=inv_number,
                    defaults={
                        'date_of_issue': date_obj,
                        'party': party,
                        'total_taxable_amount': Decimal('0.00'), 
                        'cgst_amount': Decimal('0.00'),
                        'sgst_amount': Decimal('0.00'),
                        'igst_amount': Decimal('0.00'),
                        'grand_total': Decimal('0.00')
                    }
                )

                # Create the specific Item
                qty = Decimal(str(row['WIGHT']))
                amount = Decimal(str(row['AMOUNT']))
                calculated_rate = amount / qty if qty > Decimal('0') else Decimal('0')

                InvoiceItem.objects.create(
                    invoice=invoice,
                    product=product,
                    quantity=qty,
                    rate=calculated_rate,
                    amount=amount,
                    p_no=''
                )

                # ALWAYS add this row's values to the invoice totals.
                # If it's a 1-item bill, it adds it once. If it's a 2-item bill, it sums them up perfectly!
                invoice.total_taxable_amount += amount
                invoice.cgst_amount += Decimal(str(row['C.GST']))
                invoice.sgst_amount += Decimal(str(row['S.GST']))
                invoice.igst_amount += Decimal(str(row['I.GST']))
                invoice.grand_total += Decimal(str(row['G.TOTAL']))
                invoice.save()

        self.stdout.write(self.style.SUCCESS("Successfully imported all data with flawless math consolidation!"))