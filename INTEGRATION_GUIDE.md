# Frontend + Backend Integration Guide

## Step 1: Install API Client Package

In your React app directory (`app/`), install axios:

```bash
npm install axios
```

## Step 2: Create API Service

Create `app/src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## Step 3: Create API Hooks

Create `app/src/hooks/useApi.ts`:

```typescript
import { useState, useCallback } from 'react';
import api from '../services/api';

export const useGear = () => {
  const [gear, setGear] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGear = useCallback(async (filters?: any) => {
    setLoading(true);
    try {
      const response = await api.get('/gear/', { params: filters });
      setGear(response.data.results || response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch gear');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { gear, loading, error, fetchGear };
};

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/token/', { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Fetch user data
      const userResponse = await api.get('/users/me/');
      setUser(userResponse.data);
      setError(null);
      return true;
    } catch (err) {
      setError('Login failed');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  return { user, loading, error, login, logout };
};

export const useOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders/orders/');
      setOrders(response.data.results || response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData: any) => {
    setLoading(true);
    try {
      const response = await api.post('/orders/orders/', orderData);
      setOrders([...orders, response.data]);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to create order');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [orders]);

  return { orders, loading, error, fetchOrders, createOrder };
};
```

## Step 4: Update Components & Environment Setup

First, create `app/.env` with the API configuration:

```
VITE_API_BASE=http://localhost:8000/api/v1
```

Now test your API hooks with these production-ready components:

### Gear Listing Component

```typescript
import { useEffect, useState } from 'react'
import { useGear } from '../hooks/useApi'

export function GearList() {
  const { gear, loading, error, fetchGear } = useGear()
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    fetchGear(filterCategory ? { category: filterCategory } : {})
  }, [filterCategory, fetchGear])

  if (loading) return <div className="text-center py-8">Loading gear...</div>
  if (error) return <div className="text-red-500 py-8">Error: {error}</div>

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Categories</option>
          <option value="backpacking">Backpacking</option>
          <option value="camping">Camping</option>
          <option value="climbing">Climbing</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gear.map((item) => (
          <div key={item.id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
            <img src={item.main_image} alt={item.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-2xl font-bold">${item.daily_price}</p>
                  <p className="text-gray-500 text-sm">/day</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">★ {item.rating || 'N/A'}</p>
                  <p className="text-gray-500 text-sm">{item.review_count} reviews</p>
                </div>
              </div>
              <button 
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                onClick={() => window.location.href = `/gear/${item.id}`}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Login Component

```typescript
import { useState } from 'react'
import { useAuth } from '../hooks/useApi'
import { useNavigate } from 'react-router-dom'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(username, password)
    if (success) {
      navigate('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 border rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center">Login to Nomad Gear</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email or Username</label>
        <input
          type="text"
          placeholder="you@example.com"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        disabled={loading}
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition font-semibold"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p className="text-center mt-4 text-gray-600">
        Don't have an account? <a href="/register" className="text-blue-500 hover:underline">Register here</a>
      </p>
    </form>
  )
}
```

### Register Component

```typescript
import { useState } from 'react'
import { useAuth } from '../hooks/useApi'
import { useNavigate } from 'react-router-dom'

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  })
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await register(formData)
    if (result) {
      alert('Registration successful! Logging you in...')
      navigate('/login')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 border rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center">Create Account</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">First Name</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Last Name</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Username</label>
        <input
          type="text"
          required
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Confirm Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={formData.password_confirm}
          onChange={(e) => setFormData({...formData, password_confirm: e.target.value})}
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        disabled={loading}
        type="submit"
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50 transition font-semibold"
      >
        {loading ? 'Creating Account...' : 'Register'}
      </button>

      <p className="text-center mt-4 text-gray-600">
        Already have an account? <a href="/login" className="text-blue-500 hover:underline">Login here</a>
      </p>
    </form>
  )
}
```

### Create Order Component

```typescript
import { useState, useEffect } from 'react'
import { useOrders, useGear } from '../hooks/useApi'
import { useParams, useNavigate } from 'react-router-dom'

export function CreateOrderForm() {
  const { gearId } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    quantity: 1,
    delivery_address: '',
    delivery_city: '',
    delivery_postal_code: '',
    delivery_country: '',
  })
  const [availability, setAvailability] = useState<any>(null)
  
  const { createOrder, loading, error } = useOrders()
  const { checkAvailability } = useGear()

  // Check availability when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date && gearId) {
      checkAvailability(
        parseInt(gearId), 
        formData.start_date, 
        formData.end_date, 
        formData.quantity
      ).then(data => setAvailability(data))
    }
  }, [formData.start_date, formData.end_date, formData.quantity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!availability?.available) {
      alert('This item is not available for the selected dates')
      return
    }

    const orderData = {
      gear: parseInt(gearId || '0'),
      ...formData,
    }
    
    const order = await createOrder(orderData)
    if (order) {
      navigate(`/orders/${order.id}/payment`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-8 border rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6">Book This Gear</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Rental Start Date *</label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={(e) => setFormData({
              ...formData,
              start_date: e.target.value
            })}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Rental End Date *</label>
          <input
            type="date"
            required
            value={formData.end_date}
            onChange={(e) => setFormData({
              ...formData,
              end_date: e.target.value
            })}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Quantity *</label>
        <input
          type="number"
          min="1"
          value={formData.quantity}
          onChange={(e) => setFormData({
            ...formData,
            quantity: parseInt(e.target.value)
          })}
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {availability && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${availability.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`font-bold text-lg ${availability.available ? 'text-green-800' : 'text-red-800'}`}>
            {availability.available ? '✓ Available for booking!' : '✗ Not available for these dates'}
          </p>
          {availability.available && (
            <p className="text-2xl font-bold mt-2 text-green-800">
              Total: {availability.pricing.best_price} {availability.currency}
            </p>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Delivery Address *</label>
        <input
          type="text"
          required
          value={formData.delivery_address}
          onChange={(e) => setFormData({
            ...formData,
            delivery_address: e.target.value
          })}
          placeholder="123 Main Street"
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">City *</label>
          <input
            type="text"
            required
            value={formData.delivery_city}
            onChange={(e) => setFormData({
              ...formData,
              delivery_city: e.target.value
            })}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Postal Code *</label>
          <input
            type="text"
            required
            value={formData.delivery_postal_code}
            onChange={(e) => setFormData({
              ...formData,
              delivery_postal_code: e.target.value
            })}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Country *</label>
          <input
            type="text"
            required
            value={formData.delivery_country}
            onChange={(e) => setFormData({
              ...formData,
              delivery_country: e.target.value
            })}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        disabled={loading || (availability && !availability.available)}
        type="submit"
        className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 disabled:opacity-50 transition font-semibold text-lg"
      >
        {loading ? 'Processing...' : 'Continue to Payment'}
      </button>
    </form>
  )
}
```

## Step 5: Update Vite Config (if needed)

Add proxy for development in `app/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

Then update API base URL:
```typescript
const API_BASE = '/api/v1';
```

## Step 6: Environment Variables

Create `app/.env`:

```
VITE_API_BASE=http://localhost:8000/api/v1
```

Use it:
```typescript
const API_BASE = import.meta.env.VITE_API_BASE;
```

## API Endpoints Cheatsheet

### Authentication
```
POST /auth/token/           - Login
POST /auth/token/refresh/   - Refresh token
```

### Users
```
GET  /users/                - List users
POST /users/register/       - Register
GET  /users/me/             - Get current user
PUT  /users/me/             - Update profile
GET  /users/{id}/           - Get user details
```

### Gear
```
GET  /gear/                 - List gear
GET  /gear/{id}/            - Get gear details
POST /gear/{id}/reviews/    - Add review
GET  /gear/featured/        - Featured gear
GET  /gear/search/          - Search gear
```

### Orders
```
GET  /orders/orders/                    - List orders
POST /orders/orders/                    - Create order
GET  /orders/orders/{id}/               - Get order details
POST /orders/orders/{id}/confirm/       - Confirm order
POST /orders/orders/{id}/cancel/        - Cancel order
POST /orders/orders/{id}/complete/      - Complete rental
```

### Payments
```
POST /orders/payments/process_payment/  - Process payment
```

## Tips

1. Always include `Authorization` header for authenticated requests
2. Handle 401 errors by refreshing token or redirecting to login
3. Use pagination for list endpoints (page=1, page_size=12)
4. Filter gear by category: `/gear/?category=backpacking`
5. Search gear: `/gear/search/?q=tent`

## Next: Set CORS in Backend

If frontend and backend are on different ports, ensure CORS is configured:

In `backend/.env`:
```
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Run both servers:
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd app
npm run dev
```

Your frontend will be at: http://localhost:5173
Your backend will be at: http://localhost:8000

Enjoy! 🎉
