# order/models.py
from django.db import models
from django.contrib.auth.models import User
from finished_product.models import FinishedProduct
from django.conf import settings
from django.utils import timezone
from decimal import Decimal


class Shop(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    contact_number = models.CharField(max_length=20)

    def __str__(self):
        return self.name

class Order(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('invoiced', 'Invoiced'),
        ('delivered', 'Delivered'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('payment_due', 'Payment Due'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('check', 'Check'),
        ('bank_transfer', 'Bank Transfer'),
        ('credit', 'Credit (Pay Later)'),
        ('advance', 'Advance Payment'),
    ]

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    placed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approval_date = models.DateTimeField(null=True, blank=True)
    invoice_number = models.CharField(max_length=50, blank=True)

    # Delivery tracking
    delivery_date = models.DateTimeField(null=True, blank=True)
    delivered_items_count = models.PositiveIntegerField(default=0)
    delivery_notes = models.TextField(blank=True)

    # Payment tracking
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True)
    payment_status = models.CharField(max_length=20, blank=True, default='unpaid')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_date = models.DateTimeField(null=True, blank=True)

    # Check payment details
    check_number = models.CharField(max_length=50, blank=True)
    check_date = models.DateField(null=True, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)

    # Credit payment details
    payment_due_date = models.DateField(null=True, blank=True)
    credit_term_months = models.PositiveIntegerField(default=0)  # 0 means immediate payment

    # Owner notes
    owner_notes = models.TextField(blank=True)

    @property
    def total_amount(self):
        from decimal import Decimal
        # Ensure we're working with Decimal values
        return sum((Decimal(str(item.subtotal)) if not isinstance(item.subtotal, Decimal) else item.subtotal)
                  for item in self.items.all())

    @property
    def total_paid(self):
        """Calculate the total amount paid from all payment records"""
        from django.db.models import Sum
        result = self.payments.aggregate(Sum('amount'))
        return result['amount__sum'] or Decimal('0.00')

    @property
    def amount_paid(self):
        """For backward compatibility - returns the total_paid property"""
        return self.total_paid

    @property
    def balance_due(self):
        # Ensure both operands are Decimal to avoid type mismatch
        from decimal import Decimal
        total = Decimal(str(self.total_amount)) if not isinstance(self.total_amount, Decimal) else self.total_amount
        return total - self.total_paid

    @property
    def latest_payment(self):
        """Get the most recent payment record"""
        return self.payments.order_by('-payment_date').first()

    @property
    def payment_method(self):
        """For backward compatibility - returns the payment method of the latest payment"""
        payment = self.latest_payment
        return payment.payment_method if payment else ""

    @property
    def payment_date(self):
        """For backward compatibility - returns the payment date of the latest payment"""
        payment = self.latest_payment
        return payment.payment_date if payment else None

    @property
    def check_number(self):
        """For backward compatibility - returns the check number of the latest payment"""
        payment = self.latest_payment
        return payment.check_number if payment and payment.payment_method == 'check' else ""

    @property
    def check_date(self):
        """For backward compatibility - returns the check date of the latest payment"""
        payment = self.latest_payment
        return payment.check_date if payment and payment.payment_method == 'check' else None

    @property
    def bank_name(self):
        """For backward compatibility - returns the bank name of the latest payment"""
        payment = self.latest_payment
        return payment.bank_name if payment and payment.payment_method == 'check' else ""

    @property
    def credit_term_months(self):
        """For backward compatibility - returns the credit term months of the latest payment"""
        payment = self.latest_payment
        return payment.credit_term_months if payment and payment.payment_method == 'credit' else 0

    @property
    def payment_due_date(self):
        """For backward compatibility - returns the payment due date of the latest payment"""
        payment = self.latest_payment
        return payment.payment_due_date if payment and payment.payment_method == 'credit' else None

    @property
    def is_payment_overdue(self):
        """Check if payment is overdue based on the latest payment with a due date"""
        from django.utils import timezone

        # Get payments with due dates
        payments_with_due_dates = self.payments.filter(payment_due_date__isnull=False).order_by('-payment_due_date')

        if not payments_with_due_dates.exists():
            return False

        latest_payment_with_due_date = payments_with_due_dates.first()
        return (latest_payment_with_due_date.payment_due_date < timezone.now().date() and
                self.balance_due > 0)

    def __str__(self):
        return f"Order #{self.id} - {self.shop.name}"


class Payment(models.Model):
    """
    Model to track individual payments for an order.
    This allows for multiple payment methods and partial payments.
    """
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('check', 'Check'),
        ('bank_transfer', 'Bank Transfer'),
        ('credit', 'Credit (Pay Later)'),
        ('advance', 'Advance Payment'),
    ]

    order = models.ForeignKey(Order, related_name='payments', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)

    # Check payment details
    check_number = models.CharField(max_length=50, blank=True)
    check_date = models.DateField(null=True, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)

    # Credit payment details
    credit_term_months = models.PositiveIntegerField(default=0)
    payment_due_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Payment of {self.amount} for Order #{self.order.id}"
class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    finished_product = models.ForeignKey(FinishedProduct, on_delete=models.PROTECT)
    quantity_6_packs = models.PositiveIntegerField(default=0)
    quantity_12_packs = models.PositiveIntegerField(default=0)
    quantity_extra_items = models.PositiveIntegerField(default=0)

    @property
    def subtotal(self):
        from decimal import Decimal
        # Ensure we're working with Decimal values
        unit_price = self.finished_product.selling_price or Decimal('0')
        if not isinstance(unit_price, Decimal):
            unit_price = Decimal(str(unit_price))
        total_units = Decimal(str(self.total_units))  # Convert to Decimal
        return total_units * unit_price

    def __str__(self):
        return f"{self.finished_product} x {self.total_units} units"

    @property
    def total_units(self):
        return self.quantity_6_packs * 6 + self.quantity_12_packs * 12 + self.quantity_extra_items
