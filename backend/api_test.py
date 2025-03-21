#!/usr/bin/env python3
"""
Comprehensive API testing script for UpNext application.
This script tests all API endpoints, including positive cases, negative cases, and edge cases.
"""

import requests
import json
import random
import string
import time
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://127.0.0.1:8000"
ADMIN_EMAIL = "saiprasadgudari@gmail.com"
ADMIN_PASSWORD = "IpadPro@1"  # Your password
DEBUG = True  # Set to False to hide detailed response outputs

# Test statistics
tests_run = 0
tests_passed = 0
tests_failed = 0

def log(message, level="INFO"):
    """Log a message with timestamp."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def debug(message):
    """Print debug information if DEBUG is enabled."""
    if DEBUG:
        log(message, "DEBUG")

def log_success(message):
    """Log a success message."""
    log(message, "SUCCESS")

def error(message):
    """Log an error message."""
    log(message, "ERROR")

def generate_random_string(length=10):
    """Generate a random string for test data."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def run_test(description, test_func, *args, **kwargs):
    """Run a test function with proper reporting."""
    global tests_run, tests_passed, tests_failed
    tests_run += 1
    
    log(f"Running test: {description}")
    start_time = time.time()
    
    try:
        result = test_func(*args, **kwargs)
        end_time = time.time()
        if result:
            tests_passed += 1
            log_success(f"Test passed in {end_time - start_time:.2f}s")
        else:
            tests_failed += 1
            error(f"Test failed in {end_time - start_time:.2f}s")
    except Exception as e:
        tests_failed += 1
        error(f"Test error: {str(e)}")
    
    print("---")
    return result

class UpNextAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.admin_token = None
        self.regular_user_token = None
        self.regular_user_id = None
        self.organizer_token = None
        self.event_id = None
        self.venue_id = None
        self.category_ids = []
        self.test_users = []

    def get_url(self, path):
        """Build a full URL from a path."""
        return f"{self.base_url}{path}"

    def make_request(self, method, path, data=None, token=None, expected_status=None, files=None):
        """Make an HTTP request to the API."""
        url = self.get_url(path)
        headers = {}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        if data and not files:
            headers["Content-Type"] = "application/json"
            response = requests.request(method, url, json=data, headers=headers)
        elif files:
            response = requests.request(method, url, data=data, files=files, headers=headers)
        else:
            response = requests.request(method, url, headers=headers)
        
        debug(f"{method} {url}")
        if data and not files:
            debug(f"Request: {json.dumps(data, indent=2)}")
        debug(f"Response Status: {response.status_code}")
        
        try:
            response_json = response.json()
            debug(f"Response: {json.dumps(response_json, indent=2)}")
        except:
            debug(f"Response Text: {response.text}")
        
        if expected_status and response.status_code != expected_status:
            error(f"Expected status {expected_status}, got {response.status_code}")
            return False, response
        
        return True, response

    def setup(self):
        """Initial setup: get admin token and create test data."""
        log("Setting up test environment...")
        
        # Get admin token
        request_success, response = self.make_request(
            "POST", 
            "/api/token/", 
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            expected_status=200
        )
        
        if not request_success:
            error("Failed to get admin token. Check credentials.")
            return False
        
        self.admin_token = response.json()["access"]
        log_success("Admin token obtained successfully.")
        
        # Create test users
        log("Creating test users...")
        self.create_test_users()
        
        # Get event categories
        self.get_event_categories()
        
        return True
    
    def create_test_users(self):
        """Create different types of test users."""
        # Create a regular user
        regular_email = f"testuser_{generate_random_string(8)}@example.com"
        request_success, response = self.make_request(
            "POST",
            "/api/register/",
            data={
                "username": f"testuser_{generate_random_string(8)}",
                "email": regular_email,
                "password": "TestPass123!",
                "password2": "TestPass123!",
                "first_name": "Test",
                "last_name": "User"
            },
            expected_status=201
        )
        
        if request_success:
            self.regular_user_token = response.json()["access"]
            self.regular_user_id = response.json()["user"]["id"]
            self.test_users.append({"email": regular_email, "token": self.regular_user_token, "id": self.regular_user_id})
            log_success(f"Created regular test user with ID: {self.regular_user_id}")
        
        # Create an organizer user
        organizer_email = f"organizer_{generate_random_string(8)}@example.com"
        request_success, response = self.make_request(
            "POST",
            "/api/register/",
            data={
                "username": f"organizer_{generate_random_string(8)}",
                "email": organizer_email,
                "password": "TestPass123!",
                "password2": "TestPass123!",
                "first_name": "Test",
                "last_name": "Organizer",
                "is_event_organizer": True
            },
            expected_status=201
        )
        
        if request_success:
            self.organizer_token = response.json()["access"]
            organizer_id = response.json()["user"]["id"]
            self.test_users.append({"email": organizer_email, "token": self.organizer_token, "id": organizer_id})
            log_success(f"Created organizer test user with ID: {organizer_id}")
        
        # Create a venue owner user
        venue_owner_email = f"venueowner_{generate_random_string(8)}@example.com"
        request_success, response = self.make_request(
            "POST",
            "/api/register/",
            data={
                "username": f"venueowner_{generate_random_string(8)}",
                "email": venue_owner_email,
                "password": "TestPass123!",
                "password2": "TestPass123!",
                "first_name": "Test",
                "last_name": "VenueOwner",
                "is_venue_owner": True
            },
            expected_status=201
        )
        
        if request_success:
            venue_owner_token = response.json()["access"]
            venue_owner_id = response.json()["user"]["id"]
            self.test_users.append({"email": venue_owner_email, "token": venue_owner_token, "id": venue_owner_id})
            log_success(f"Created venue owner test user with ID: {venue_owner_id}")
            
            # Create a venue with this user
            self.create_test_venue(venue_owner_token)
    
    def get_event_categories(self):
        """Get event categories for testing."""
        request_success, response = self.make_request(
            "GET",
            "/api/v1/event-categories/",
            expected_status=200
        )
        
        if request_success and response.json():
            self.category_ids = [category["id"] for category in response.json()]
            log_success(f"Found {len(self.category_ids)} event categories.")
        else:
            error("Failed to get event categories or no categories found.")
    
    def create_test_venue(self, token):
        """Create a test venue for booking tests."""
        venue_name = f"Test Venue {generate_random_string(8)}"
        request_success, response = self.make_request(
            "POST",
            "/api/v1/venues/",
            token=token,
            data={
                "name": venue_name,
                "description": "A test venue for API testing",
                "address": "123 Test Street",
                "city": "Test City",
                "state": "Test State",
                "zip_code": "12345",
                "country": "Test Country",
                "capacity": 100,
                "hourly_rate": 50.00,
                "min_booking_hours": 2
            },
            expected_status=201
        )
        
        if request_success:
            self.venue_id = response.json()["id"]
            log_success(f"Created test venue with ID: {self.venue_id}")
            
            # Add venue availability
            self.make_request(
                "POST",
                f"/api/v1/venues/{self.venue_id}/availability/",
                token=token,
                data={
                    "day_of_week": 0,  # Monday
                    "opening_time": "09:00:00",
                    "closing_time": "17:00:00",
                    "is_available": True
                },
                expected_status=201
            )
        else:
            error("Failed to create test venue.")
    
    def create_test_event(self):
        """Create a test event for attendee tests."""
        if not self.organizer_token or not self.venue_id or not self.category_ids:
            error("Missing required data to create test event.")
            return False
        
        # Create a future-dated event
        tomorrow = datetime.now() + timedelta(days=1)
        start_date = tomorrow.strftime("%Y-%m-%d")
        end_date = (tomorrow + timedelta(days=1)).strftime("%Y-%m-%d")
        
        event_title = f"Test Event {generate_random_string(8)}"
        request_success, response = self.make_request(
            "POST",
            "/api/v1/events/",
            token=self.organizer_token,
            data={
                "title": event_title,
                "description": "A test event for API testing",
                "category_ids": [self.category_ids[0]] if self.category_ids else [],
                "start_date": start_date,
                "start_time": "10:00:00",
                "end_date": end_date,
                "end_time": "16:00:00",
                "venue": self.venue_id,
                "visibility": "public",
                "status": "published",
                "capacity": 50,
                "is_free": True
            },
            expected_status=201
        )
        
        if request_success:
            self.event_id = response.json()["id"]
            log_success(f"Created test event with ID: {self.event_id}")
            return True
        else:
            error("Failed to create test event.")
            return False
    
    def cleanup(self):
        """Clean up test data."""
        log("Cleaning up test data...")
        
        # Delete test events
        if self.event_id:
            self.make_request(
                "DELETE",
                f"/api/v1/events/{self.event_id}/",
                token=self.organizer_token
            )
            log(f"Deleted test event with ID: {self.event_id}")
        
        # Delete test venues
        if self.venue_id:
            # Just mark as inactive instead of deleting, as it might be linked to events
            self.make_request(
                "PATCH",
                f"/api/v1/venues/{self.venue_id}/",
                token=self.test_users[2]["token"],  # Venue owner token
                data={"is_active": False}
            )
            log(f"Marked test venue as inactive: {self.venue_id}")
        
        # We won't delete test users to avoid disrupting related test data
        
        log("Cleanup completed.")
    
    def test_authentication(self):
        """Test authentication endpoints."""
        # Test invalid login
        request_success, response = self.make_request(
            "POST",
            "/api/token/",
            data={"email": "nonexistent@example.com", "password": "wrong"},
            expected_status=401
        )
        
        # Test valid login
        request_success, response = self.make_request(
            "POST",
            "/api/token/",
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            expected_status=200
        )
        
        if not request_success:
            return False
        
        access_token = response.json()["access"]
        refresh_token = response.json()["refresh"]
        
        # Test token refresh
        request_success, response = self.make_request(
            "POST",
            "/api/token/refresh/",
            data={"refresh": refresh_token},
            expected_status=200
        )
        
        if not request_success:
            return False
        
        # Test registration validation
        request_success, response = self.make_request(
            "POST",
            "/api/register/",
            data={
                "username": "testuser",
                "email": "invalid-email",  # Invalid email format
                "password": "short",  # Too short
                "password2": "different"  # Doesn't match
            },
            expected_status=400
        )
        
        return True
    
    def test_user_management(self):
        """Test user management endpoints."""
        if not self.regular_user_token or not self.regular_user_id:
            error("Regular user not created. Skipping user management tests.")
            return False
        
        # Test get current user
        request_success, response = self.make_request(
            "GET",
            "/api/v1/users/me/",
            token=self.regular_user_token,
            expected_status=200
        )
        
        if not request_success:
            return False
        
        # Test update current user
        new_bio = f"Updated bio {generate_random_string(20)}"
        request_success, response = self.make_request(
            "PUT",
            "/api/v1/users/update_me/",
            token=self.regular_user_token,
            data={"bio": new_bio},
            expected_status=200
        )
        
        if not request_success or response.json()["bio"] != new_bio:
            return False
        
        # Test profile access
        request_success, response = self.make_request(
            "GET",
            f"/api/v1/profiles/{self.regular_user_id}/",
            token=self.regular_user_token,
            expected_status=200
        )
        
        if not request_success:
            return False
        
        # Test update profile
        request_success, response = self.make_request(
            "PUT",
            f"/api/v1/profiles/{self.regular_user_id}/",
            token=self.regular_user_token,
            data={"phone_number": f"555-{generate_random_string(4)}"},
            expected_status=200
        )
        
        # Test unauthorized access to another user's profile
        if self.test_users and len(self.test_users) > 1:
            other_user_id = self.test_users[1]["id"]
            request_success, response = self.make_request(
                "PUT",
                f"/api/v1/profiles/{other_user_id}/",
                token=self.regular_user_token,
                data={"phone_number": "555-1234"},
                expected_status=403  # Forbidden
            )
        
        return True
    
    def test_event_management(self):
        """Test event management endpoints."""
        if not self.organizer_token:
            error("Organizer user not created. Skipping event management tests.")
            return False
        
        # Test creating event without required fields
        request_success, response = self.make_request(
            "POST",
            "/api/v1/events/",
            token=self.organizer_token,
            data={"title": "Incomplete Event"},
            expected_status=400  # Bad request due to missing fields
        )
        
        # Create a valid event
        if not self.event_id and not self.create_test_event():
            return False
        
        # Test get event details
        request_success, response = self.make_request(
            "GET",
            f"/api/v1/events/{self.event_id}/",
            token=self.organizer_token,
            expected_status=200
        )
        
        if not request_success:
            return False
        
        # Test update event
        updated_title = f"Updated Event {generate_random_string(8)}"
        request_success, response = self.make_request(
            "PUT",
            f"/api/v1/events/{self.event_id}/",
            token=self.organizer_token,
            data={
                "title": updated_title,
                "description": "Updated description",
                "start_date": response.json()["start_date"],
                "start_time": response.json()["start_time"],
                "end_date": response.json()["end_date"],
                "end_time": response.json()["end_time"],
            },
            expected_status=200
        )
        
        if not request_success or response.json()["title"] != updated_title:
            return False
        
        # Test attend event as regular user
        request_success, response = self.make_request(
            "POST",
            f"/api/v1/events/{self.event_id}/attend/",
            token=self.regular_user_token,
            expected_status=201
        )
        
        if not request_success:
            return False
        
        # Test getting event attendees
        request_success, response = self.make_request(
            "GET",
            f"/api/v1/events/{self.event_id}/attendees/",
            token=self.organizer_token,
            expected_status=200
        )
        
        if not request_success:
            return False
        
        # Test cancel attendance
        request_success, response = self.make_request(
            "POST",
            f"/api/v1/events/{self.event_id}/cancel/",
            token=self.regular_user_token,
            expected_status=200
        )
        
        if not request_success:
            return False
        
        # Test commenting on event
        request_success, response = self.make_request(
            "POST",
            f"/api/v1/events/{self.event_id}/comments/",
            token=self.regular_user_token,
            data={"content": f"Test comment {generate_random_string(10)}"},
            expected_status=201
        )
        
        if not request_success:
            return False
        
        # Test get comments
        request_success, response = self.make_request(
            "GET",
            f"/api/v1/events/{self.event_id}/comments/",
            token=self.regular_user_token,
            expected_status=200
        )
        
        return request_success
    
    def test_venue_management(self):
        """Test venue management endpoints."""
        if not self.venue_id:
            error("Test venue not created. Skipping venue management tests.")
            return False
        
        # Get venue details
        request_success, response = self.make_request(
            "GET",
            f"/api/v1/venues/{self.venue_id}/",
            expected_status=200
        )
        
        if not request_success:
            return False
        
        venue_owner_token = self.test_users[2]["token"] if len(self.test_users) > 2 else None
        if not venue_owner_token:
            error("Venue owner token not available. Skipping venue management tests.")
            return False
        
        # Update venue
        # Update venue
        updated_name = f"Updated Venue {generate_random_string(8)}"
        request_success, response = self.make_request(
            "PATCH",  # Change from PUT to PATCH
            f"/api/v1/venues/{self.venue_id}/",
            token=venue_owner_token,
            data={"name": updated_name, "description": "Updated description"},
            expected_status=200
        )
        
        if not request_success or response.json()["name"] != updated_name:
            return False
        
        # Test unauthorized venue update
        request_success, response = self.make_request(
            "PUT",
            f"/api/v1/venues/{self.venue_id}/",
            token=self.regular_user_token,
            data={"name": "Unauthorized Update"},
            expected_status=403  # Forbidden
        )
        
        # Test venue booking
        tomorrow = datetime.now() + timedelta(days=1)
        booking_date = tomorrow.strftime("%Y-%m-%d")
        
        request_success, response = self.make_request(
            "POST",
            f"/api/v1/venues/{self.venue_id}/bookings/",
            token=self.regular_user_token,
            data={
                "booking_date": booking_date,
                "start_time": "10:00:00",
                "end_time": "14:00:00"
            },
            expected_status=201
        )
        
        if not request_success:
            return False
        
        booking_id = response.json()["id"]
        
        # Test get venue bookings
        request_success, response = self.make_request(
            "GET",
            f"/api/v1/venues/{self.venue_id}/bookings/",
            token=venue_owner_token,
            expected_status=200
        )
        
        if not request_success:
            return False
        
        # Test venue review
        request_success, response = self.make_request(
            "POST",
            f"/api/v1/venues/{self.venue_id}/reviews/",
            token=self.regular_user_token,
            data={
                "rating": 5,
                "comment": f"Great venue! {generate_random_string(10)}"
            },
            expected_status=201
        )
        
        if not request_success:
            return False
        
        # Try to review twice (should fail)
        request_success, response = self.make_request(
            "POST",
            f"/api/v1/venues/{self.venue_id}/reviews/",
            token=self.regular_user_token,
            data={
                "rating": 4,
                "comment": "Another review"
            },
            expected_status=400  # Bad request - already reviewed
        )
        
        # Test get venue reviews
        request_success, response = self.make_request(
            "GET",
            f"/api/v1/venues/{self.venue_id}/reviews/",
            expected_status=200
        )
        
        return request_success
    
    def test_filtering_and_searching(self):
        """Test filtering and searching capabilities."""
        # Test event filtering
        request_success, response = self.make_request(
            "GET",
            "/api/v1/events/?status=published&visibility=public",
            expected_status=200
        )
        
        if not request_success:
            return False
        
        # Test venue filtering
        request_success, response = self.make_request(
            "GET",
            "/api/v1/venues/?min_capacity=50&max_capacity=200",
            expected_status=200
        )
        
        if not request_success:
            return False
        
        # Test event search
        if self.event_id:
            # Get the title of our test event
            request_success, response = self.make_request(
                "GET",
                f"/api/v1/events/{self.event_id}/",
                expected_status=200
            )
            
            if request_success:
                event_title = response.json()["title"]
                search_term = event_title.split()[0]  # Use first word of title
                
                request_success, response = self.make_request(
                    "GET",
                    f"/api/v1/events/?search={search_term}",
                    expected_status=200
                )
                
                if not request_success:
                    return False
        
        # Test category filtering
        if self.category_ids:
            request_success, response = self.make_request(
                "GET",
                f"/api/v1/events/?category={self.category_ids[0]}",
                expected_status=200
            )
            
            if not request_success:
                return False
        
        return True
    
    def test_edge_cases(self):
        """Test edge cases and error handling."""
        # Test non-existent resources
        request_success, response = self.make_request(
            "GET",
            "/api/v1/events/99999/",
            expected_status=404
        )
        
        # Test invalid JWT token
        request_success, response = self.make_request(
            "GET",
            "/api/v1/users/me/",
            token="invalid.token.here",
            expected_status=401
        )
        
        # Test expired token handling (skipping as it's hard to test without waiting)
        
        # Test invalid data formats
        request_success, response = self.make_request(
            "POST",
            "/api/v1/events/",
            token=self.organizer_token,
            data={
                "title": "Invalid Date Format Event",
                "start_date": "not-a-date",  # Invalid date format
                "start_time": "not-a-time",  # Invalid time format
                "end_date": "2023-13-40",    # Invalid date values
                "end_time": "25:70:99"       # Invalid time values
            },
            expected_status=400
        )
        
        # Test max capacity event
        if self.event_id:
            # First, update event to have capacity of 1
            request_success, response = self.make_request(
                "PATCH",
                f"/api/v1/events/{self.event_id}/",
                token=self.organizer_token,
                data={"capacity": 1},
                expected_status=200
            )
            
            if request_success:
                # Register first user
                request_success, response = self.make_request(
                    "POST",
                    f"/api/v1/events/{self.event_id}/attend/",
                    token=self.regular_user_token,
                    expected_status=201
                )
                
                if request_success and len(self.test_users) > 1:
                    # Try to register second user (should be waitlisted)
                    request_success, response = self.make_request(
                        "POST",
                        f"/api/v1/events/{self.event_id}/attend/",
                        token=self.test_users[1]["token"],
                        expected_status=200  # Note: 200 because waitlisting is successful
                    )
                    
                    # Reset capacity for other tests
                    self.make_request(
                        "PATCH",
                        f"/api/v1/events/{self.event_id}/",
                        token=self.organizer_token,
                        data={"capacity": 50},
                        expected_status=200
                    )
        
        return True
    
    def run_all_tests(self):
        """Run all tests sequentially."""
        if not self.setup():
            error("Setup failed. Cannot run tests.")
            return False
        
        tests = [
            ("Authentication", self.test_authentication),
            ("User Management", self.test_user_management),
            ("Event Management", self.test_event_management),
            ("Venue Management", self.test_venue_management),
            ("Filtering and Searching", self.test_filtering_and_searching),
            ("Edge Cases", self.test_edge_cases)
        ]
        
        for description, test_func in tests:
            run_test(description, test_func)
        
        self.cleanup()
        
        # Print summary
        log(f"Tests complete: {tests_passed}/{tests_run} passed, {tests_failed} failed")
        return tests_failed == 0

if __name__ == "__main__":
    log("Starting UpNext API Tests")
    
    tester = UpNextAPITester(BASE_URL)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)