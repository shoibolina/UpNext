# events/management/commands/init_data.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from events.models import EventCategory
from venues.models import VenueCategory, VenueAmenity
from faker import Faker
import random

User = get_user_model()
fake = Faker()

class Command(BaseCommand):
    help = 'Initialize database with sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting data initialization...'))
        
        # Create admin user if doesn't exist
        if not User.objects.filter(email='admin@upnext.com').exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@upnext.com',
                password='adminpassword',
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write(self.style.SUCCESS('Admin user created'))
        
        # Create sample users
        self._create_sample_users()
        
        # Create event categories
        self._create_event_categories()
        
        # Create venue categories
        self._create_venue_categories()
        
        # Create venue amenities
        self._create_venue_amenities()
        
        self.stdout.write(self.style.SUCCESS('Data initialization complete!'))
    
    def _create_sample_users(self):
        # Create organizer users
        organizer_count = 0
        for i in range(5):
            if not User.objects.filter(email=f'organizer{i+1}@upnext.com').exists():
                User.objects.create_user(
                    username=f'organizer{i+1}',
                    email=f'organizer{i+1}@upnext.com',
                    password='password123',
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    is_event_organizer=True,
                    bio=fake.paragraph()
                )
                organizer_count += 1
        
        if organizer_count > 0:
            self.stdout.write(self.style.SUCCESS(f'Created {organizer_count} organizer users'))
        
        # Create venue owner users
        venue_owner_count = 0
        for i in range(5):
            if not User.objects.filter(email=f'venue{i+1}@upnext.com').exists():
                User.objects.create_user(
                    username=f'venue{i+1}',
                    email=f'venue{i+1}@upnext.com',
                    password='password123',
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    is_venue_owner=True,
                    bio=fake.paragraph()
                )
                venue_owner_count += 1
        
        if venue_owner_count > 0:
            self.stdout.write(self.style.SUCCESS(f'Created {venue_owner_count} venue owner users'))
        
        # Create regular users
        regular_user_count = 0
        for i in range(10):
            if not User.objects.filter(email=f'user{i+1}@upnext.com').exists():
                User.objects.create_user(
                    username=f'user{i+1}',
                    email=f'user{i+1}@upnext.com',
                    password='password123',
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    bio=fake.paragraph()
                )
                regular_user_count += 1
        
        if regular_user_count > 0:
            self.stdout.write(self.style.SUCCESS(f'Created {regular_user_count} regular users'))
    
    def _create_event_categories(self):
        categories = [
            {'name': 'Music', 'description': 'Concerts, festivals, band performances, and music-related activities'},
            {'name': 'Education', 'description': 'Workshops, seminars, lectures, and educational events'},
            {'name': 'Sports', 'description': 'Games, tournaments, fitness classes, and sports activities'},
            {'name': 'Technology', 'description': 'Tech conferences, hackathons, meetups, and tech demos'},
            {'name': 'Business', 'description': 'Networking events, conferences, and professional gatherings'},
            {'name': 'Arts', 'description': 'Art exhibitions, gallery openings, performances, and creative showcases'},
            {'name': 'Food & Drink', 'description': 'Food festivals, cooking classes, wine tastings, and culinary events'},
            {'name': 'Community', 'description': 'Community gatherings, meetups, and local events'},
            {'name': 'Charity', 'description': 'Fundraisers, volunteer opportunities, and charitable events'},
            {'name': 'Other', 'description': 'Events that don\'t fit into other categories'}
        ]
        
        created_count = 0
        for category in categories:
            _, created = EventCategory.objects.get_or_create(
                name=category['name'],
                defaults={'description': category['description']}
            )
            if created:
                created_count += 1
        
        if created_count > 0:
            self.stdout.write(self.style.SUCCESS(f'Created {created_count} event categories'))
    
    def _create_venue_categories(self):
        categories = [
            {'name': 'Conference Hall', 'description': 'Large spaces for conferences and formal events'},
            {'name': 'Theater', 'description': 'Venues with stage and seating for performances'},
            {'name': 'Restaurant', 'description': 'Food service venues available for private events'},
            {'name': 'Bar/Club', 'description': 'Nightlife venues for social events'},
            {'name': 'Outdoor Space', 'description': 'Parks, gardens, and open-air venues'},
            {'name': 'Coworking Space', 'description': 'Shared workspaces available for meetings and events'},
            {'name': 'Hotel', 'description': 'Hotel venues for conferences and social events'},
            {'name': 'Sports Facility', 'description': 'Gyms, fields, and sports-focused venues'},
            {'name': 'Studio', 'description': 'Art, dance, or recording studios'},
            {'name': 'Educational', 'description': 'Classrooms, lecture halls, and training spaces'}
        ]
        
        created_count = 0
        for category in categories:
            _, created = VenueCategory.objects.get_or_create(
                name=category['name'],
                defaults={'description': category['description']}
            )
            if created:
                created_count += 1
        
        if created_count > 0:
            self.stdout.write(self.style.SUCCESS(f'Created {created_count} venue categories'))
    
    def _create_venue_amenities(self):
        amenities = [
            {'name': 'WiFi', 'description': 'High-speed internet access', 'icon': 'wifi'},
            {'name': 'Parking', 'description': 'On-site parking available', 'icon': 'car'},
            {'name': 'AV Equipment', 'description': 'Audio-visual equipment', 'icon': 'tv'},
            {'name': 'Catering', 'description': 'In-house catering services', 'icon': 'utensils'},
            {'name': 'Stage', 'description': 'Performance stage', 'icon': 'theater-masks'},
            {'name': 'Seating', 'description': 'Chairs and tables available', 'icon': 'chair'},
            {'name': 'Bar', 'description': 'Bar service available', 'icon': 'glass-martini'},
            {'name': 'Accessible', 'description': 'Wheelchair accessible', 'icon': 'wheelchair'},
            {'name': 'Kitchen', 'description': 'Kitchen facilities', 'icon': 'utensils'},
            {'name': 'Restrooms', 'description': 'Clean restroom facilities', 'icon': 'restroom'},
            {'name': 'Air Conditioning', 'description': 'Climate controlled', 'icon': 'snowflake'},
            {'name': 'Outdoor Area', 'description': 'Outdoor space available', 'icon': 'tree'}
        ]
        
        created_count = 0
        for amenity in amenities:
            _, created = VenueAmenity.objects.get_or_create(
                name=amenity['name'],
                defaults={
                    'description': amenity['description'],
                    'icon': amenity['icon']
                }
            )
            if created:
                created_count += 1
        
        if created_count > 0:
            self.stdout.write(self.style.SUCCESS(f'Created {created_count} venue amenities'))