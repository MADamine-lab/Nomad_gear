from django.core.management.base import BaseCommand
from orders.models import Order, OrderTimeline

class Command(BaseCommand):
    help = 'Create a default timeline entry for orders that currently have none'

    def handle(self, *args, **options):
        missing = Order.objects.filter(timeline__isnull=True)
        count = missing.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS('All orders already have timeline entries.'))
            return

        for order in missing:
            OrderTimeline.objects.create(
                order=order,
                event_type='created',
                description='Order imported/backfilled',
                created_by=order.user if order.user else None
            )
        self.stdout.write(self.style.SUCCESS(f'Backfilled {count} orders with default timeline entry.'))
