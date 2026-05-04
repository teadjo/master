import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API,
});

api.interceptors.response.use(
  response => response,
  error => {
    if (!navigator.onLine) {
      console.log('Offline mode - nema API');
      
    }
    return Promise.reject(error);
  }
);