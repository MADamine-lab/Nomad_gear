"""
Management command to load sample data for development
Usage: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from gear.models import Category, GearKit
from datetime import date
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with sample gear and user data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        # Create categories
        categories_data = [
            {'name': 'Backpacking', 'icon': 'backpack'},
            {'name': 'Camping', 'icon': 'tent'},
            {'name': 'Climbing', 'icon': 'mountain'},
            {'name': 'Lighting', 'icon': 'lamp'},
            {'name': 'Family', 'icon': 'people'},
        ]
        
        categories = {}
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'icon': cat_data['icon'],
                    'description': f'{cat_data["name"]} gear and equipment',
                    'image': 'categories/placeholder.jpg'
                }
            )
            categories[cat_data['name']] = cat
            if created:
                self.stdout.write(f'  Created category: {cat.name}')
        
        # Create sample gear
        gear_data = [
            {
                'name': 'Weekend Light Kit',
                'category': 'Backpacking',
                'description': 'Système de sommeil + sac',
                'daily_price': 87,
                'weekly_price': 500,
                'monthly_price': 1800,
                'quantity': 5,
                'weight': '2.5 kg',
                'brand': 'OutdoorPro',
            },
            {
                'name': 'Trail Cook Set',
                'category': 'Backpacking',
                'description': 'Réchaud + batterie',
                'daily_price': 54,
                'weekly_price': 300,
                'monthly_price': 1000,
                'quantity': 8,
                'weight': '1.2 kg',
                'brand': 'CampChef',
            },
            {
                'name': 'Alpine Shelter',
                'category': 'Camping',
                'description': 'Tente + empreinte',
                'daily_price': 96,
                'weekly_price': 550,
                'monthly_price': 2000,
                'quantity': 3,
                'weight': '1.8 kg',
                'brand': 'MountainHardwear',
            },
            {
                'name': 'Night Light Kit',
                'category': 'Lighting',
                'description': 'Lanterne + frontale',
                'daily_price': 36,
                'weekly_price': 200,
                'monthly_price': 700,
                'quantity': 10,
                'weight': '0.5 kg',
                'brand': 'BrightGear',
            },
            {
                'name': 'Family Basecamp',
                'category': 'Family',
                'description': 'Grande tente + chaises',
                'daily_price': 165,
                'weekly_price': 900,
                'monthly_price': 3200,
                'quantity': 2,
                'weight': '8 kg',
                'brand': 'ColemanPro',
            },
        ]
        
        for gear in gear_data:
            category = categories[gear['category']]
            g, created = GearKit.objects.get_or_create(
                name=gear['name'],
                defaults={
                    'category': category,
                    'description': gear['description'],
                    'long_description': f'Premium {gear["name"]} for outdoor adventures',
                    'daily_price': Decimal(gear['daily_price']),
                    'weekly_price': Decimal(gear['weekly_price']),
                    'monthly_price': Decimal(gear['monthly_price']),
                    'quantity_available': gear['quantity'],
                    'weight': gear.get('weight', ''),
                    'brand': gear.get('brand', ''),
                    'main_image': 'gear/placeholder.jpg',
                    'status': 'available',
                }
            )
            if created:
                self.stdout.write(f'  Created gear: {g.name}')
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
