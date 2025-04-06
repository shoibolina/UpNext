# UpNext
Many community events struggle with limited visibility and reach, while potential attendees face difficulties discovering relevant local activities. Current solutions are fragmented across social media platforms, specialized websites, or physical bulletin boards, creating barriers to effective event discovery and management. Additionally, finding and booking suitable venues for events often involves a cumbersome process of researching, contacting, and negotiating with venue owners separately from the event planning process. UpNext addresses these challenges by providing a dedicated platform that integrates event creation, discovery, and venue booking in one cohesive ecosystem.

# Project Proposal
https://docs.google.com/document/d/1dr8se0HVpj_WIavnwsuFajgPJJW-922zLvdqvMdmyUI/edit?tab=t.0

# Project Roadmap
https://docs.google.com/spreadsheets/d/1p8vujcTDqnsbsG0XPGc3VQEsrvbbUbXXhNcpMoxSQf0/edit?gid=0#gid=0

# Group Charter
https://docs.google.com/document/d/1F_BbxWogCVSSup0Pme5d-XIZ0jbCg39yP4M3IWzPQBA/edit?tab=t.0

# Kanban Board
https://cs540group3.atlassian.net/jira/software/projects/SCRUM/boards/1

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

## Setup Instructions

### Prerequisites
- Python 3.8+
    - **Important** This is not compatible wth Python 3.13. For best performance, use Python 3.11
- PostgreSQL
- pip
- Node.js

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shoibolina/UpNext.git
   cd UpNext
   ```

2. Create and activate a virtual environment:
    - **Important Note** Ensure that Python 3.11 is being used
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install the required packages in the backend:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the database in `upnext/settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'upnext',  # Your DB name
           'USER': 'username',  # Your DB user
           'PASSWORD': 'password',  # Your DB password
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

8. Run the development server to launch the backend:
   ```bash
   python manage.py runserver
   ```

9. In a new terminal, navigate the the frontend folder and use the following command to launch the frontend:
   ```bash
   npm start
   ```

The app should now be usable locally.

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
- `POST /api/v1/venues/{id}/bookings/` - Book a venue
- `POST /api/v1/venues/{id}/reviews/` - Review a venue

