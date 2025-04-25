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

4. Ensure PostreSQL is installed & create a database in your terminal 
   - Can be found here: https://www.postgresql.org/download/
   - Run the following commands in a terminal to create a database:
   ```bash
   psql -U your_username
   CREATE DATABASE your_DB_name;
   ```

5. Configure the database based on the layout of `upnext/settings.py`. Create a .env file if you do not have one already, and then set all 5 variables below to your database settings (i.e.)
   ```python
   DATABASES = {
       'default': {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME"), # Replace with your database name
            "USER": config("DB_USER"),  # Replace with your database user
            "PASSWORD": config("DB_PASSWORD"),  # Replace with your database password
            "HOST": config("DB_HOST"), # To run locally, use localhost
            "PORT": config("DB_PORT"), # To run locally, use 5432
       }
   }

   # -- Your .env file should have variables set like this:
   DB_NAME=database_name
   ```

7. Follow the instructions to setup email functionality for password reset [here](#email-integration), then return to continue to the next step

8. Apply migrations:
   ```bash
   python manage.py migrate
   ```

9. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

10. Initialize sample data:
   ```bash
   python manage.py init_data
   ```

11. Run the development server to launch the backend:
   ```bash
   python manage.py runserver
   ```

12. In a new terminal, navigate the the frontend folder and use the following command to launch the frontend:
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
