# Quick Start Guide - Nomad Gear Backend

## Setup in 5 Minutes

### 1. Open PowerShell or Command Prompt

Navigate to the backend folder:
```powershell
cd "C:\Users\Amine Dardouri\Downloads\Nomad Gear Site\backend"
```

### 2. Create Virtual Environment

```powershell
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 4. Configure Environment

Create a `.env` file by copying from `.env.example`:
```powershell
Copy-Item .env.example .env
```

You can use the default settings for development.

### 5. Setup Database

```powershell
python manage.py migrate
```

### 6. Create Admin User

```powershell
python manage.py createsuperuser
```

Enter:
- Username: admin
- Email: admin@example.com
- Password: admin123

### 7. Load Sample Data

```powershell
python manage.py seed_data
```

### 8. Run Development Server

```powershell
python manage.py runserver
```

## Access Your API

- **API Root**: http://localhost:8000/api/v1/
- **API Docs (Swagger)**: http://localhost:8000/api/v1/docs/
- **Admin Panel**: http://localhost:8000/admin/
  - Login with: admin / admin123

## Common Commands

```powershell
# Run migrations
python manage.py migrate

# Create migrations after model changes
python manage.py makemigrations

# Access Django shell
python manage.py shell

# Load sample data
python manage.py seed_data

# Deactivate virtual environment
deactivate
```

## Frontend Connection

In your React app (`app/src/`), create an API client:

```javascript
// src/api/client.js
const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  gear: {
    list: () => fetch(`${API_BASE}/gear/`).then(r => r.json()),
    get: (id) => fetch(`${API_BASE}/gear/${id}/`).then(r => r.json()),
  },
  orders: {
    create: (data, token) => 
      fetch(`${API_BASE}/orders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }).then(r => r.json()),
  }
};
```

## Database Info

- **Type**: SQLite (default for development)
- **Location**: `backend/db.sqlite3`
- **For production**: Use PostgreSQL (update DB_ENGINE in .env)

## API Base URL for Frontend

Update your frontend API calls to use:
```
http://localhost:8000/api/v1
```

## Troubleshooting

**Port 8000 in use?**
```powershell
python manage.py runserver 8001
```

**Module not found?**
```powershell
pip install --upgrade -r requirements.txt
```

**Need to reset database?**
```powershell
Remove-Item db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

## Stop the Server

Press `Ctrl + C` in the terminal running the dev server.

## Next Steps

1. Start the frontend development server in a new terminal
2. Configure CORS in `.env` if frontend port differs
3. Create test users and gear in admin panel
4. Connect frontend to API endpoints

Happy coding! 🚀
