import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Cliente de Axios centralizado para conectar con el backend de NestJS
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones para inyectar el token JWT y prevenir respuestas 304 en CDN
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.headers) {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
    }

    // Para peticiones GET, agregar un parámetro timestamp '_t' para forzar respuesta fresca (Evita 304 en Railway Edge)
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejar la expiración del token (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Forzar cierre de sesión en el cliente si el backend responde con Unauthorized
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
