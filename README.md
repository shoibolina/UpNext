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
- [Peer Group Tasks](#peer-tasks)

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

## Email Integration

To enable email functionality such as password reset, follow these steps to set up the Resend API:

### Step 1: Get Your API Key

- Visit the Resend API keys page: [https://resend.com/api-keys](https://resend.com/api-keys)
- Log in or sign up for a free account.

### Step 2: Create an API Key

- Click **“Create API Key”**
- Give your key a meaningful name (e.g., `UpNext Dev` or `Password Reset Key`)
- Select the access level:
  - **Full Access** – recommended for most use cases
  - **Limited Access** – for read-only or scoped usage (optional)

### Step 3: Copy the API Key

- After generating the key, **copy it** for use in your environment setup.

### Step 4: Add the Key to Your Project

- Open your project's `.env` file and add the following line:

  ```env
  RESEND_API_KEY=re_your_actual_key_here

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

## Peer Tasks
Create a Check-In System for events & users (Functionalities do not have to be limited to those suggested below)
-Visual updates to the front end (Option to cancel check-in, Updates to user dashboard for events requiring check-in )
-Page for event owner to see who has checked in
-Individual ID or QR code type verification (like CORQ)
-Additional option added to event creation for events that require check-in (check-in time start & end)
-Disable check in button after the time has passed
# Sprint 4 Implementation Tasks (choose any five that you guys find it easier to do)

## Task 1: Real-Time Messaging System
Implementation of a comprehensive messaging system allowing users and event organizers to communicate directly through the platform with real-time capabilities.

Key Features:
- Direct messaging between users and event organizers
- Real-time message delivery using WebSockets
- Typing indicators and read receipts
- Notification system for new messages
- Conversation threading and search functionality

## Task 2: User Following Functionality
Implementation of social features enabling users to follow other users and receive updates about events their connections are attending or organizing.

Key Features:
- Follow/unfollow capability for all users
- Activity feed showing events from followed users
- Notification system for followed user activities
- Profile sections displaying followers and following lists
- User suggestion system

## Task 3: Media Upload System
Implementation of a comprehensive media upload system for user profiles, events, and venues that handles storage, optimization, and display.

Key Features:
- Profile picture upload and management
- Multiple image uploads for events and venues
- Gallery management with optimization for different display contexts
- Secure storage and retrieval with proper access control

## Task 4: Advanced Search and Filtering System
Implementation of a powerful search and filtering system enabling users to find events and venues matching specific criteria with high precision.

Key Features:
- Full-text search across multiple models (events, venues)
- Multiple filter options (date, category, location, price)
- Customizable sorting capabilities
- Search history and saved searches for logged-in users

## Task 5: Event Calendar and Schedule Management
Implementation of a comprehensive calendar system allowing users to view and manage their event schedule, with integration to external calendar services.

Key Features:
- Personal event calendar showing registered events
- Multiple calendar views (day, week, month)
- Calendar export functionality (iCal, Google Calendar)
- Event reminders and conflict detection
- Recurring event support





## Task 6: make the ui consistent across all the pages


## Task 7: create a dashboard for event analytics for organizers
## Task 8: add share event functionality
## Task 9: build a calener view for upcoming events
## Task 10: implement event bookmarking like show all the favorite events in a page
