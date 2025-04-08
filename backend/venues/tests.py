from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils.text import slugify
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, time, timedelta
import json

from .models import (
    Venue, VenueCategory, VenueAmenity, VenueImage, 
    VenueAvailability, VenueBooking, VenueReview
)

User = get_user_model()

class VenueModelTestCase(TestCase):
    """
Test cases for Venue models.
These tests verify the proper creation and relationships between
all venue-related models, including categories, amenities, images,
availability, bookings, and reviews.
"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
        
        # Create venue categories
        self.category = VenueCategory.objects.create(
            name='Conference Hall',
            description='Suitable for large conferences'
        )
        
        # Create venue amenities
        self.amenity = VenueAmenity.objects.create(
            name='WiFi',
            description='High-speed internet',
            icon='wifi'
        )
        
        # Create venue
        self.venue = Venue.objects.create(
            name='Test Venue',
            description='A test venue description',
            owner=self.user,
            address='123 Test St',
            city='Test City',
            state='Test State',
            zip_code='12345',
            country='United States',
            capacity=100,
            hourly_rate=Decimal('50.00'),
            min_booking_hours=2
        )
        
        # Add categories and amenities to venue
        self.venue.categories.add(self.category)
        self.venue.amenities.add(self.amenity)
        
        # Create venue image
        self.image = VenueImage.objects.create(
            venue=self.venue,
            caption='Test Image',
            is_primary=True
        )
        
        # Create venue availability
        self.availability = VenueAvailability.objects.create(
            venue=self.venue,
            day_of_week=0,  # Monday
            opening_time=time(8, 0),  # 8:00 AM
            closing_time=time(20, 0),  # 8:00 PM
            is_available=True
        )
        
        # Create venue booking
        self.booking = VenueBooking.objects.create(
            venue=self.venue,
            booker=self.user,
            booking_date=date.today() + timedelta(days=7),  # Next week
            start_time=time(10, 0),  # 10:00 AM
            end_time=time(14, 0),  # 2:00 PM
            total_price=Decimal('200.00'),
            status='confirmed'
        )
        
        # Create venue review
        self.review = VenueReview.objects.create(
            venue=self.venue,
            user=self.user,
            rating=5,
            comment='Great venue!'
        )
    
    def test_venue_creation(self):
        """Test that venue is created correctly with a slug"""
        self.assertEqual(self.venue.name, 'Test Venue')
        self.assertEqual(self.venue.slug, 'test-venue')
        self.assertEqual(self.venue.owner, self.user)
        self.assertEqual(self.venue.capacity, 100)
        self.assertEqual(self.venue.hourly_rate, Decimal('50.00'))
        self.assertTrue(self.venue.is_active)
        self.assertFalse(self.venue.is_verified)
    
    def test_venue_categories(self):
        """Test venue categories relationship"""
        self.assertEqual(self.venue.categories.count(), 1)
        self.assertEqual(self.venue.categories.first(), self.category)
        self.assertEqual(self.category.venues.first(), self.venue)
    
    def test_venue_amenities(self):
        """Test venue amenities relationship"""
        self.assertEqual(self.venue.amenities.count(), 1)
        self.assertEqual(self.venue.amenities.first(), self.amenity)
        self.assertEqual(self.amenity.venues.first(), self.venue)
    
    def test_venue_images(self):
        """Test venue images relationship"""
        self.assertEqual(self.venue.images.count(), 1)
        self.assertEqual(self.venue.images.first(), self.image)
        self.assertTrue(self.image.is_primary)
    
    def test_venue_availability(self):
        """Test venue availability relationship"""
        self.assertEqual(self.venue.availability.count(), 1)
        self.assertEqual(self.venue.availability.first(), self.availability)
        self.assertEqual(self.availability.day_of_week, 0)  # Monday
        self.assertEqual(self.availability.opening_time, time(8, 0))
        self.assertEqual(self.availability.closing_time, time(20, 0))
        self.assertTrue(self.availability.is_available)
    
    def test_venue_bookings(self):
        """Test venue bookings relationship"""
        self.assertEqual(self.venue.bookings.count(), 1)
        self.assertEqual(self.venue.bookings.first(), self.booking)
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertEqual(self.booking.total_price, Decimal('200.00'))
    
    def test_venue_reviews(self):
        """Test venue reviews relationship"""
        self.assertEqual(self.venue.reviews.count(), 1)
        self.assertEqual(self.venue.reviews.first(), self.review)
        self.assertEqual(self.review.rating, 5)
        self.assertEqual(self.review.comment, 'Great venue!')
    
    def test_str_representations(self):
        """Test string representations of models"""
        self.assertEqual(str(self.venue), 'Test Venue')
        self.assertEqual(str(self.category), 'Conference Hall')
        self.assertEqual(str(self.amenity), 'WiFi')
        self.assertEqual(str(self.image), 'Image for Test Venue')
        self.assertEqual(str(self.availability), 'Test Venue - Monday')
        self.assertEqual(str(self.booking), f'Test Venue booked by {self.user.email} on {self.booking.booking_date}')
        self.assertEqual(str(self.review), f'5-star review for Test Venue by {self.user.email}')

class VenueSerializerTestCase(TestCase):
    """
Test cases for Venue serializers.
These tests validate that venue data is properly serialized for API responses,
including both basic venue information and detailed relationships.
"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
        
        self.category = VenueCategory.objects.create(
            name='Conference Hall',
            description='Suitable for large conferences'
        )
        
        self.amenity = VenueAmenity.objects.create(
            name='WiFi',
            description='High-speed internet',
            icon='wifi'
        )
        
        self.venue = Venue.objects.create(
            name='Test Venue',
            description='A test venue description',
            owner=self.user,
            address='123 Test St',
            city='Test City',
            state='Test State',
            zip_code='12345',
            country='United States',
            capacity=100,
            hourly_rate=Decimal('50.00'),
            min_booking_hours=2
        )
        
        self.venue.categories.add(self.category)
        self.venue.amenities.add(self.amenity)
        
        # Creating a primary image
        self.image = VenueImage.objects.create(
            venue=self.venue,
            caption='Test Image',
            is_primary=True
        )
        
        # Create a review to test rating calculation
        self.review = VenueReview.objects.create(
            venue=self.venue,
            user=self.user,
            rating=4,
            comment='Good venue'
        )
        
        from rest_framework.test import APIRequestFactory
        from rest_framework.request import Request
        from .serializers import VenueSerializer, VenueDetailSerializer
        
        self.factory = APIRequestFactory()
        request = self.factory.get('/')
        request.user = self.user
        self.context = {'request': Request(request)}
        
        self.venue_serializer = VenueSerializer(instance=self.venue, context=self.context)
        self.venue_detail_serializer = VenueDetailSerializer(instance=self.venue, context=self.context)
        
    def test_venue_serializer_fields(self):
        """Test that VenueSerializer serializes correctly"""
        data = self.venue_serializer.data
        
        self.assertEqual(data['name'], 'Test Venue')
        self.assertEqual(data['slug'], 'test-venue')
        self.assertEqual(data['description'], 'A test venue description')
        self.assertEqual(data['capacity'], 100)
        self.assertEqual(data['hourly_rate'], '50.00')  # Serialized as string
        self.assertTrue(data['is_active'])
        
        # Test relationships
        self.assertEqual(len(data['categories']), 1)
        self.assertEqual(data['categories'][0]['name'], 'Conference Hall')
        
        self.assertEqual(len(data['amenities']), 1)
        self.assertEqual(data['amenities'][0]['name'], 'WiFi')
        
        # Test calculated fields
        self.assertEqual(data['rating'], 4)  # One review with rating 4
        
        # Test primary image
        self.assertIsNotNone(data['primary_image'])
        self.assertEqual(data['primary_image']['caption'], 'Test Image')
        
    def test_venue_detail_serializer_fields(self):
        """Test that VenueDetailSerializer includes additional details"""
        data = self.venue_detail_serializer.data
        
        # Make sure it has all basic fields
        self.assertEqual(data['name'], 'Test Venue')
        self.assertEqual(data['capacity'], 100)
        
        # Check for additional fields specific to detail serializer
        self.assertIn('images', data)
        self.assertEqual(len(data['images']), 1)
        
        self.assertIn('reviews', data)
        self.assertEqual(len(data['reviews']), 1)
        self.assertEqual(data['reviews'][0]['rating'], 4)
        self.assertEqual(data['reviews'][0]['comment'], 'Good venue')

class VenueAPITestCase(APITestCase):
    """
Test cases for Venue API endpoints.
These tests verify the proper functioning of all venue-related API endpoints,
including venue creation, filtering, bookings, and reviews.
"""
    
    def setUp(self):
        """Set up test data for venue API tests"""
        # Create test users - one as venue owner, one as customer
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
        
        self.another_user = User.objects.create_user(
            email='another@example.com',
            password='password123',
            username='anotheruser'
        )
        
        # Create venue category for classification
        self.category = VenueCategory.objects.create(
            name='Conference Hall',
            description='Suitable for large conferences'
        )
        
        # Create venue amenity for filtering
        self.amenity = VenueAmenity.objects.create(
            name='WiFi',
            description='High-speed internet',
            icon='wifi'
        )
        
        # Create a test venue with the owner being the first user
        self.venue = Venue.objects.create(
            name='Test Venue',
            description='A test venue description',
            owner=self.user,
            address='123 Test St',
            city='Test City',
            state='Test State',
            zip_code='12345',
            country='United States',
            capacity=100,
            hourly_rate=Decimal('50.00'),
            min_booking_hours=2
        )
        
        # Associate venue with category and amenity
        self.venue.categories.add(self.category)
        self.venue.amenities.add(self.amenity)
        
        # Create venue availability for Monday
        self.availability = VenueAvailability.objects.create(
            venue=self.venue,
            day_of_week=0,  # Monday
            opening_time=time(8, 0),  # 8:00 AM
            closing_time=time(20, 0),  # 8:00 PM
            is_available=True
        )
        
        # Initialize API client for making requests
        self.client = APIClient()
    
    def test_venue_list_unauthenticated(self):
        """Test list venues endpoint for unauthenticated users"""
        url = reverse('venue-list')
        response = self.client.get(url)
        
        # Verify successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify venues are returned, handling both paginated and non-paginated responses
        if isinstance(response.data, dict) and 'results' in response.data:
            self.assertGreaterEqual(len(response.data['results']), 1)
        else:
            self.assertGreaterEqual(len(response.data), 1)
    
    def test_venue_create_authenticated(self):
        """Test venue creation as authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('venue-list')
        data = {
            'name': 'New Venue',
            'description': 'A brand new venue',
            'address': '456 New St',
            'city': 'New City',
            'state': 'New State',
            'zip_code': '54321',
            'country': 'United States',
            'capacity': 200,
            'hourly_rate': '75.00',
            'min_booking_hours': 3,
            'category_ids': [self.category.id],
            'amenity_ids': [self.amenity.id]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Venue')
        self.assertEqual(response.data['capacity'], 200)
        self.assertEqual(response.data['hourly_rate'], '75.00')
        
        # Verify categories and amenities were added
        self.assertEqual(len(response.data['categories']), 1)
        self.assertEqual(len(response.data['amenities']), 1)
        
        # Verify venue exists in database
        self.assertTrue(Venue.objects.filter(name='New Venue').exists())
    
    def test_venue_update_owner(self):
        """Test venue update as owner"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('venue-detail', kwargs={'pk': self.venue.id})
        data = {
            'name': 'Updated Venue',
            'description': 'Updated description',
            'hourly_rate': '60.00'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Venue')
        self.assertEqual(response.data['description'], 'Updated description')
        self.assertEqual(response.data['hourly_rate'], '60.00')
        
        # Refresh from database
        self.venue.refresh_from_db()
        self.assertEqual(self.venue.name, 'Updated Venue')
    
    def test_venue_update_non_owner(self):
        """Test venue update as non-owner (should fail)"""
        self.client.force_authenticate(user=self.another_user)
        
        url = reverse('venue-detail', kwargs={'pk': self.venue.id})
        data = {
            'name': 'Unauthorized Update',
            'description': 'This should not work'
        }
        
        response = self.client.patch(url, data, format='json')
        
        # Should get permission denied
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Venue should remain unchanged
        self.venue.refresh_from_db()
        self.assertEqual(self.venue.name, 'Test Venue')
    
    def test_venue_filter_by_category(self):
        """Test filtering venues by category"""
        url = reverse('venue-list')
        response = self.client.get(f"{url}?category={self.category.id}")
        
        # Verify successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Handle potential pagination in response
        results = response.data
        if isinstance(response.data, dict) and 'results' in response.data:
            results = response.data['results']
            
        # Verify that our test venue is in the filtered results
        test_venue_in_response = False
        for venue in results:
            if isinstance(venue, dict) and 'name' in venue and venue['name'] == 'Test Venue':
                test_venue_in_response = True
                break
                
        self.assertTrue(test_venue_in_response, "Test venue should be included in category filter results")
    
    def test_venue_filter_by_amenity(self):
        """Test filtering venues by amenity"""
        url = reverse('venue-list')
        response = self.client.get(f"{url}?amenity={self.amenity.id}")
        
        # Verify successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Handle potential pagination in response
        results = response.data
        if isinstance(response.data, dict) and 'results' in response.data:
            results = response.data['results']
            
        # Verify that our test venue is in the filtered results
        test_venue_in_response = False
        for venue in results:
            if isinstance(venue, dict) and 'name' in venue and venue['name'] == 'Test Venue':
                test_venue_in_response = True
                break
                
        self.assertTrue(test_venue_in_response, "Test venue should be included in amenity filter results")
    
    def test_venue_filter_by_city(self):
        """Test filtering venues by city"""
        url = reverse('venue-list')
        response = self.client.get(f"{url}?city=Test+City")
        
        # Verify successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Handle potential pagination in response
        results = response.data
        if isinstance(response.data, dict) and 'results' in response.data:
            results = response.data['results']
            
        # Verify that our test venue is in the filtered results
        test_venue_in_response = False
        for venue in results:
            if isinstance(venue, dict) and 'name' in venue and venue['name'] == 'Test Venue':
                test_venue_in_response = True
                break
                
        self.assertTrue(test_venue_in_response, "Test venue should be included in city filter results")
    
    def test_venue_review_create(self):
        """Test creating a venue review"""
        self.client.force_authenticate(user=self.another_user)
        
        url = reverse('venue-reviews', kwargs={'venue_pk': self.venue.id})
        data = {
            'rating': 5,
            'comment': 'Excellent venue!'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['comment'], 'Excellent venue!')
        
        # Verify review was created in database
        self.assertTrue(VenueReview.objects.filter(
            venue=self.venue,
            user=self.another_user,
            rating=5
        ).exists())
    
    def test_venue_duplicate_review(self):
        """Test that users cannot submit multiple reviews for same venue"""
        # Create initial review
        VenueReview.objects.create(
            venue=self.venue,
            user=self.another_user,
            rating=4,
            comment='Good venue'
        )
        
        self.client.force_authenticate(user=self.another_user)
        
        url = reverse('venue-reviews', kwargs={'venue_pk': self.venue.id})
        data = {
            'rating': 3,
            'comment': 'Trying to submit another review'
        }
        
        response = self.client.post(url, data, format='json')
        
        # Should fail with validation error
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_venue_booking_create(self):
        """Test creating a venue booking"""
        self.client.force_authenticate(user=self.another_user)
        
        # Next Monday
        booking_date = date.today()
        while booking_date.weekday() != 0:  # 0 is Monday
            booking_date += timedelta(days=1)
        
        url = reverse('venue-bookings', kwargs={'venue_pk': self.venue.id})
        data = {
            'booking_date': booking_date.isoformat(),
            'start_time': '10:00:00',
            'end_time': '15:00:00',
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'confirmed')
        
        # Verify booking was created correctly
        booking = VenueBooking.objects.get(id=response.data['id'])
        self.assertEqual(booking.venue, self.venue)
        self.assertEqual(booking.booker, self.another_user)
        self.assertEqual(booking.booking_date, booking_date)
        self.assertEqual(booking.start_time, time(10, 0))
        self.assertEqual(booking.end_time, time(15, 0))
        
        # Check that total price was calculated correctly (5 hours * $50 = $250)
        self.assertEqual(booking.total_price, Decimal('250.00'))
    
    def test_venue_booking_overlap(self):
        """Test that overlapping bookings are rejected"""
        self.client.force_authenticate(user=self.another_user)
        
        # Next Monday
        booking_date = date.today()
        while booking_date.weekday() != 0:  # 0 is Monday
            booking_date += timedelta(days=1)
        
        # Create an existing booking
        VenueBooking.objects.create(
            venue=self.venue,
            booker=self.user,
            booking_date=booking_date,
            start_time=time(12, 0),
            end_time=time(14, 0),
            total_price=Decimal('100.00'),
            status='confirmed'
        )
        
        url = reverse('venue-bookings', kwargs={'venue_pk': self.venue.id})
        data = {
            'booking_date': booking_date.isoformat(),
            'start_time': '13:00:00',  # Overlaps with existing booking
            'end_time': '15:00:00',
        }
        
        response = self.client.post(url, data, format='json')
        
        # Should fail with validation error
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_venue_availability_add(self):
        """Test adding venue availability"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('venue-availability', kwargs={'venue_pk': self.venue.id})
        data = {
            'day_of_week': 1,  # Tuesday
            'opening_time': '09:00:00',
            'closing_time': '18:00:00',
            'is_available': True,
            'repeat_weekly': True
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['day_of_week'], 1)
        self.assertEqual(response.data['day_name'], 'Tuesday')
        
        # Verify availability was created in database
        self.assertTrue(VenueAvailability.objects.filter(
            venue=self.venue,
            day_of_week=1,
            opening_time=time(9, 0),
            closing_time=time(18, 0)
        ).exists())
    
    def test_venue_cancel_booking(self):
        """Test canceling a venue booking"""
        # Create a booking
        booking = VenueBooking.objects.create(
            venue=self.venue,
            booker=self.another_user,
            booking_date=date.today() + timedelta(days=7),
            start_time=time(10, 0),
            end_time=time(15, 0),
            total_price=Decimal('250.00'),
            status='confirmed'
        )
        
        self.client.force_authenticate(user=self.another_user)
        
        url = reverse('venuebooking-cancel', kwargs={'pk': booking.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify booking was cancelled
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'cancelled')
    
    def test_venue_my_bookings(self):
        """Test the my bookings endpoint"""
        # Create bookings for both users
        VenueBooking.objects.create(
            venue=self.venue,
            booker=self.another_user,
            booking_date=date.today() + timedelta(days=7),
            start_time=time(10, 0),
            end_time=time(15, 0),
            total_price=Decimal('250.00'),
            status='confirmed'
        )
        
        VenueBooking.objects.create(
            venue=self.venue,
            booker=self.user,
            booking_date=date.today() + timedelta(days=8),
            start_time=time(10, 0),
            end_time=time(15, 0),
            total_price=Decimal('250.00'),
            status='confirmed'
        )
        
        self.client.force_authenticate(user=self.another_user)
        
        url = reverse('venuebooking-my')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Should only see their own booking