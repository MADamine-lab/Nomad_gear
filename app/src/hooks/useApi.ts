import { useState, useCallback } from 'react';
import api from '../services/api';

export const useGear = () => {
  const [gear, setGear] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGear = useCallback(async (filters?: any) => {
  setLoading(true);
  try {
    console.log('useApi: Fetching gear with filters:', filters);
    
    // Convert category name to slug if needed
    let params = { ...filters };
    if (filters?.category) {
      // Map common names to slugs or convert to lowercase
      const categoryMap: Record<string, string> = {
        'Family': 'family',
        'Camping': 'camping', 
        'Lighting': 'lighting',
        'Backpacking': 'backpacking',
        'All Gear': '',
      };
      params.category = categoryMap[filters.category] || filters.category.toLowerCase();
    }
    
    const response = await api.get('/gear/', { params });
    console.log('useApi: Gear response:', response.data);
    setGear(response.data.results || response.data);
    setError(null);
  } catch (err: any) {
    const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch gear';
    console.error('useApi: Error fetching gear:', err.response?.data || err);
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
}, []);

  const searchGear = useCallback(async (query: string, filters?: any) => {
    setLoading(true);
    try {
      const response = await api.get('/search/', { 
        params: { q: query, ...filters } 
      });
      setGear(response.data.results || response.data);
      setError(null);
    } catch (err: any) {
      setError('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getGearDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/${id}/`);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError('Failed to fetch gear details');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAvailability = useCallback(async (gearId: number, startDate: string, endDate: string, quantity: number) => {
    setLoading(true);
    try {
      const response = await api.post(`/gear/${gearId}/check_availability/`, {
        start_date: startDate,
        end_date: endDate,
        quantity
      });
      setError(null);
      return response.data;
    } catch (err: any) {
      setError('Failed to check availability');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    gear, 
    loading, 
    error, 
    fetchGear, 
    searchGear, 
    getGearDetail,
    checkAvailability
  };
};

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/token/', { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Fetch user data
      const userResponse = await api.get('/users/me/');
      setUser(userResponse.data);
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      console.error('Login error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Sending registration data:', userData);
      
      // Make sure we're sending the right data structure including password_confirm
      const registrationData = {
        email: userData.email,
        username: userData.username,
        password: userData.password,
        password_confirm: userData.password_confirm,  // IMPORTANT: Backend requires this!
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
      };
      
      console.log('Formatted registration data:', registrationData);
      
      const response = await api.post('/users/register/', registrationData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Registration successful:', response.data);
      return true; // Return boolean for easier checking
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      
      // Handle different error formats
      let errorMsg = 'Registration failed';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle field-specific errors
        if (typeof errorData === 'object' && !errorData.detail) {
          const fieldErrors = Object.entries(errorData)
            .map(([field, messages]: [string, any]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgArray.join(', ')}`;
            })
            .join('; ');
          errorMsg = fieldErrors;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMsg = errorData;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/users/me/');
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch('/users/me/', userData);
      setUser(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to update profile';
      setError(errorMsg);
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  return { 
    user, 
    loading, 
    error, 
    login, 
    register, 
    logout, 
    getCurrentUser,
    updateProfile
  };
};

export const useOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (filters?: any) => {
    setLoading(true);
    try {
      const params = { page_size: 100, ...filters }; // request more items
      console.log('fetchOrders params', params);
      const response = await api.get('/orders/', { params });
      console.log('fetchOrders response', response.data);
      setOrders(response.data.results || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch orders');
      console.error('fetchOrders error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderDetail = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/orders/${id}/`);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError('Failed to fetch order details');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData: any) => {
    setLoading(true);
    try {
      const response = await api.post('/orders/', orderData);
      setOrders([...orders, response.data]);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create order');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [orders]);

  const cancelOrder = useCallback(async (id: number, reason?: string) => {
    setLoading(true);
    try {
      const response = await api.post(`/orders/${id}/cancel/`, { reason });
      setOrders(orders.map(o => o.id === id ? response.data : o));
      setError(null);
      return response.data;
    } catch (err: any) {
      setError('Failed to cancel order');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [orders]);

  const confirmOrder = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await api.post(`/orders/${id}/confirm/`);
      setOrders(orders.map(o => o.id === id ? response.data : o));
      setError(null);
      return response.data;
    } catch (err: any) {
      setError('Failed to confirm order');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [orders]);

  return { 
    orders, 
    loading, 
    error, 
    fetchOrders,
    getOrderDetail,
    createOrder,
    cancelOrder,
    confirmOrder
  };
};

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (paymentData: any) => {
    setLoading(true);
    try {
      const response = await api.post('/payments/process_payment/', paymentData);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Payment failed');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, processPayment };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/gear/categories/');
      setCategories(response.data.results || response.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { categories, loading, error, fetchCategories };
};