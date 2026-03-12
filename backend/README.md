# Nomad Gear Backend API

A Django REST Framework API for the Nomad Gear outdoor equipment rental platform. This backend provides comprehensive management for gear rentals, user accounts, orders, and payments.

## Features

- **User Management**: Registration, authentication, user profiles, and reviews
- **Gear Catalog**: Complete gear database with categories, pricing, and availability
- **Rental System**: Order management, booking, and rental tracking
- **Payment Processing**: Multiple payment methods and transaction tracking
- **Review System**: User and gear reviews with ratings
- **Admin Dashboard**: Django admin interface for content management
- **API Documentation**: OpenAPI/Swagger documentation
- **JWT Authentication**: Secure token-based authentication

## Tech Stack

- **Python 3.9+**
- **Django 5.0.1**
- **Django REST Framework 3.14.0**
- **PostgreSQL / SQLite**
- **JWT Authentication**
- **Celery** (optional, for async tasks)
- **Redis** (optional, for caching and Celery)

## Project Structure

```
backend/
├── nomad_gear/              # Project configuration
│   ├── settings.py          # Django settings
│   ├── urls.py              # Main URL configuration
│   ├── wsgi.py              # WSGI application
│   └── asgi.py              # ASGI application
├── users/                   # User management app
│   ├── models.py            # User models
│   ├── views.py             # User viewsets
│   ├── serializers.py       # User serializers
│   └── urls.py              # User URLs
├── gear/                    # Gear catalog app
│   ├── models.py            # Gear models
│   ├── views.py             # Gear viewsets
│   ├── serializers.py       # Gear serializers
│   └── urls.py              # Gear URLs
├── orders/                  # Order management app
│   ├── models.py            # Order models
│   ├── views.py             # Order viewsets
│   ├── serializers.py       # Order serializers
│   └── urls.py              # Order URLs
├── requirements.txt         # Python dependencies
├── manage.py                # Django management script
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Installation

1. **Clone or navigate to the backend directory**

```bash
cd backend
```

2. **Create and activate virtual environment**

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Create environment file**

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your settings
```

5. **Run migrations**

```bash
python manage.py migrate
```

6. **Create superuser (admin)**

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

7. **Collect static files** (for production)

```bash
python manage.py collectstatic --noinput
```

8. **Run development server**

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication

- `POST /api/v1/auth/token/` - Obtain JWT token
- `POST /api/v1/auth/token/refresh/` - Refresh JWT token

### Users

- `GET /api/v1/users/` - List users
- `POST /api/v1/users/register/` - Register new user
- `GET /api/v1/users/me/` - Get current user profile
- `PUT/PATCH /api/v1/users/me/` - Update current user profile
- `GET /api/v1/users/{id}/` - Get user details
- `GET /api/v1/users/{id}/reviews/` - Get user reviews
- `GET /api/v1/users/reviews/my_reviews/` - Get current user's reviews

### Gear

- `GET /api/v1/gear/` - List all gear
- `GET /api/v1/gear/?category=backpacking` - Filter by category
- `GET /api/v1/gear/?min_price=50&max_price=200` - Filter by price range
- `GET /api/v1/gear/featured/` - Get featured gear
- `GET /api/v1/gear/search/?q=tent` - Search gear
- `GET /api/v1/gear/{id}/` - Get gear details
- `POST /api/v1/gear/{id}/check_availability/` - Check availability for date range
- `GET /api/v1/gear/categories/` - List categories
- `POST /api/v1/gear/{gear_slug}/reviews/` - Create gear review
- `GET /api/v1/gear/{gear_slug}/reviews/` - Get gear reviews

### Orders

- `GET /api/orders/` - List user's orders
- `POST /api/orders/` - Create new order
- `GET /api/orders/{id}/` - Get order details
- `POST /api/orders/{id}/confirm/` - Confirm order
- `POST /api/orders/{id}/cancel/` - Cancel order
- `POST /api/orders/{id}/start_rental/` - Start rental
- `POST /api/orders/{id}/complete_rental/` - Complete rental
- `POST /api/orders/{id}/report_damage/` - Report damage
- `GET /api/orders/active_rentals/` - Get active rentals
- `GET /api/orders/overdue_rentals/` - Get overdue rentals
- `GET /api/orders/statistics/` - Get order statistics

### Payments

- `GET /api/v1/orders/payments/` - List payments
- `POST /api/v1/orders/payments/process_payment/` - Process payment

## API Documentation

Interactive API documentation is available at:

- **Swagger UI**: `http://localhost:8000/api/v1/docs/`
- **ReDoc**: `http://localhost:8000/api/v1/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/v1/schema/`

## Database Models

### Users App
- `CustomUser` - Extended Django user model with profile information
- `UserReview` - User reviews and ratings
- `UserNotification` - Notification preferences

### Gear App
- `Category` - Gear categories
- `GearKit` - Individual gear items for rental
- `GearReview` - Reviews for gear
- `GearImage` - Additional images for gear
- `GearAvailability` - Availability tracking by date

### Orders App
- `Order` - Rental orders/bookings
- `Payment` - Payment records
- `OrderTimeline` - Order status change tracking
- `GearConditionReport` - Gear condition before/after rental

## Configuration

### Database Setup

**Development (SQLite)**: Automatically configured in settings.

**Production (PostgreSQL)**:

1. Install PostgreSQL client:
```bash
pip install psycopg2-binary
```

2. Update `.env`:
```
DB_ENGINE=django.db.backends.postgresql
DB_NAME=nomad_gear
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
```

### Email Configuration

Update `.env` for email sending:

```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

For testing, use console backend (default).

### CORS Configuration

Update `CORS_ALLOWED_ORIGINS` in `.env` to match your frontend URL:

```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Management Commands

```bash
# Create superuser
python manage.py createsuperuser

# Apply migrations
python manage.py migrate

# Create migrations
python manage.py makemigrations

# Collect static files
python manage.py collectstatic

# Run tests
python manage.py test

# Django shell
python manage.py shell

# Load sample data
python manage.py loaddata fixtures/initial_data.json
```

## Deployment

### Using Gunicorn

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn nomad_gear.wsgi:application --bind 0.0.0.0:8000
```

### Environment for Production

```
DEBUG=False
SECRET_KEY=your-very-secure-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
```

### Docker (Optional)

Create a `Dockerfile` in the backend directory:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "nomad_gear.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

## Frontend Integration

Connect your React frontend to this API:

```javascript
// Example API call
const fetchGear = async () => {
  const response = await fetch('http://localhost:8000/api/v1/gear/');
  const data = await response.json();
  return data;
};

// Authentication
const login = async (email, password) => {
  const response = await fetch('http://localhost:8000/api/v1/auth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password })
  });
  const data = await response.json();
  localStorage.setItem('access_token', data.access);
};

// Using token in requests
const getOrders = async (token) => {
  const response = await fetch('http://localhost:8000/api/orders/', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## Troubleshooting

### Port Already In Use
```bash
# Use a different port
python manage.py runserver 8001
```

### Database Locked (SQLite)
```bash
# Delete the database and remake migrations
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Missing Dependencies
```bash
# Reinstall requirements
pip install --upgrade -r requirements.txt
```

## Security Notes

- Never commit `.env` files to version control
- Always use strong `SECRET_KEY` in production
- Enable HTTPS in production (`SECURE_SSL_REDIRECT=True`)
- Use environment variables for sensitive data
- Implement rate limiting for production
- Regular security updates for dependencies

## Support & Documentation

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)

## License

This project is proprietary. All rights reserved.

## Contributing

For contributions and bugfixes, please follow the existing code style and add tests for new features.
