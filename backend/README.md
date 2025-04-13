# UpNext - Event Management Platform

UpNext is a comprehensive web-based platform designed to connect community members with local events while empowering event organizers with robust tools to create, manage, and promote their activities. This repository contains the backend API implementation built with Django REST Framework.

## Table of Contents

- [Features](#features)
- [Backend Architecture](#backend-architecture)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Connecting to Frontend](#connecting-to-frontend)
- [Development Workflow](#development-workflow)
- [Future Enhancements](#future-enhancements)

## Features

### User Management
- User registration and authentication using JWT tokens
- Custom user model with different roles (regular users, event organizers, venue owners)
- User profiles with personal information
- Profile editing and management

### Event Management
- Complete event CRUD operations
- Event categories system
- Event visibility settings (public, private, invite-only)
- Advanced event filtering and search
- Event status management (draft, published, cancelled, completed)
- Event attendance system with registration and cancellation
- Commenting system for events

### Venue Management
- Venue creation and management
- Venue categories and amenities
- Venue availability settings
- Venue reviews and ratings
- Venue booking system with pricing calculation
- Advanced venue search and filtering

### Tickets App

- Ticket: Represents event tickets issued to attendees
- TicketVerification: Tracks ticket verification details

## Backend Architecture

### Tech Stack
- **Framework**: Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **CORS**: django-cors-headers

### App Structure
- **users**: Custom user model, authentication, and profiles
- **events**: Event management, categories, attendance, and comments
- **venues**: Venue management, booking, availability, and reviews
- **upnext**: Core project configuration

### Models Overview

#### Users App
- `User`: Custom user model extending Django's AbstractUser
- `UserProfile`: Extended profile information for users

#### Events App
- `EventCategory`: Categories for events
- `Event`: Main event model with details, scheduling, etc.
- `EventAttendee`: Tracks users attending events
- `EventComment`: Comments on events

#### Venues App
- `VenueCategory`: Categories for venues
- `VenueAmenity`: Amenities that venues can offer
- `Venue`: Main venue model with details
- `VenueAvailability`: Tracks venue availability
- `VenueImage`: Images for venues
- `VenueBooking`: Tracks venue bookings
- `VenueReview`: Reviews for venues

### Tickets

- `GET` /api/v1/tickets/ - List all tickets (filtered by user permissions)
- `GET` /api/v1/tickets/{id}/ - Retrieve a ticket
- `GET` /api/v1/tickets/my_tickets/ - List tickets for the current user
- `POST` /api/v1/tickets/generate_for_event/ - Generate a ticket for an event
- `POST` /api/v1/tickets/{id}/cancel/ - Cancel a ticket
- `GET` /api/v1/events/{id}/tickets/ - List tickets for a specific event

### Ticket Verification

- `GET` /api/v1/ticket-verifications/ - List all verifications (filtered by user permissions)
- `POST` /api/v1/ticket-verifications/ - Verify a ticket by ticket number
- `POST` /api/v1/ticket-verifications/verify_by_qr/ - Verify a ticket using QR code data


## Setup Instructions

### Prerequisites
- Python 3.8+
- PostgreSQL
- pip

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shoibolina/UpNext.git
   cd UpNext
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the database in `upnext/settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'upnext',  # Your DB name
           'USER': 'syd',  # Your DB user
           'PASSWORD': 'syd',  # Your DB password
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

5. Apply migrations:
   ```bash
   python manage.py migrate
   ```

6. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

7. Initialize sample data:
   ```bash
   python manage.py init_data
   ```

8. Run the development server:
   ```bash
   python manage.py runserver
   ```

## API Documentation

You can access the Swagger documentation of the API at:
- Local: http://localhost:8000/swagger/
- Alternative: http://localhost:8000/redoc/

### Main API Endpoints

#### Authentication
- `POST /api/token/` - Obtain JWT token pair
- `POST /api/token/refresh/` - Refresh JWT token
- `POST /api/register/` - Register a new user

#### Users
- `GET /api/v1/users/` - List all users
- `GET /api/v1/users/me/` - Get current user
- `PUT /api/v1/users/update_me/` - Update current user

#### Events
- `GET /api/v1/events/` - List all events
- `POST /api/v1/events/` - Create an event
- `GET /api/v1/events/{id}/` - Retrieve an event
- `PUT /api/v1/events/{id}/` - Update an event
- `POST /api/v1/events/{id}/attend/` - Register for an event
- `POST /api/v1/events/{id}/comment/` - Comment on an event

#### Venues
- `GET /api/v1/venues/` - List all venues
- `POST /api/v1/venues/` - Create a venue
- `GET /api/v1/venues/{id}/` - Retrieve a venue
- `GET /api/v1/venues/{venue_id}/availability/` – Get availability slots for a venue
- `POST /api/v1/venues/{venue_id}/availability/` – Create a venue availability slot
- `PUT /api/v1/venues/{venue_id}/availability/{id}/` – Update venue availability slot
- `DELETE /api/v1/venues/{venue_id}/availability/{id}/` – Delete venue availability slot
- `GET /api/v1/venues/{venue_id}/bookings/` – View bookings for a specific venue
- `POST /api/v1/venues/{venue_id}/bookings/` – Book a venue
- `DELETE /api/v1/venues/{venue_id}/bookings/{id}/cancel/` – Cancel a booking
- `GET /api/v1/venues/all-bookings/` – View all venue bookings (for all venues, used of venue owners only)
- `GET /api/v1/venues/{venue_id}/reviews/` – List reviews for a venue
- `POST /api/v1/venues/{venue_id}/reviews/` – Submit a review


