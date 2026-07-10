from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from .models import Payment, Installment
from .serializers import PaymentSerializer, InstallmentSerializer
from apps.authentication.permissions import IsOwnerOrAdmin


class PaymentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.select_related('deal', 'deal__client').all()

    def perform_create(self, serializer):
        payment = serializer.save()
        _auto_generate_installments(payment)


class PaymentDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class InstallmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = InstallmentSerializer

    def get_queryset(self):
        return Installment.objects.filter(payment_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        serializer.save(payment_id=self.kwargs['pk'])


class InstallmentDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    queryset = Installment.objects.select_related('payment').all()
    serializer_class = InstallmentSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        _recalculate_payment(instance.payment)


def _auto_generate_installments(payment):
    count = max(payment.installments_count, 1)
    per_inst = int(payment.total_amount) // count
    remainder = int(payment.total_amount) - per_inst * count
    today = timezone.now().date()
    for i in range(count):
        amount = per_inst + (remainder if i == 0 else 0)
        Installment.objects.create(
            payment=payment,
            number=i + 1,
            amount=amount,
            due_date=today + timezone.timedelta(days=30 * i),
        )


def _recalculate_payment(payment):
    installments = payment.installments.all()
    paid_total = installments.filter(status='paid').aggregate(t=Sum('amount'))['t'] or 0
    payment.paid_amount = paid_total
    total_count = installments.count()
    paid_count = installments.filter(status='paid').count()
    overdue_count = installments.filter(status='overdue').count()
    if total_count == 0 or (paid_count == 0 and overdue_count == 0):
        payment.status = 'pending'
    elif paid_count == total_count:
        payment.status = 'paid'
    elif overdue_count > 0:
        payment.status = 'overdue'
    else:
        payment.status = 'partial'
    payment.save(update_fields=['paid_amount', 'status'])
