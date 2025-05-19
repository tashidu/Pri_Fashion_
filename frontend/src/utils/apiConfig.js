/**
 * API Configuration for Pri Fashion
 *
 * This file contains the configuration for the API endpoints.
 * It automatically detects whether the app is running in development or production
 * and sets the appropriate base URL.
 */

// Determine if we're in production based on the URL or environment
const isProduction = process.env.NODE_ENV === 'production';

// Set the base URL for API requests
const API_BASE_URL = isProduction
  ? 'https://vinukatashidu.pythonanywhere.com/api' // Production API URL (will be replaced during build)
  : 'http://localhost:8000/api';                  // Development API URL

export default API_BASE_URL;
