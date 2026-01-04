/**
 * API Configuration - Centralized API Base URL
 * Uses environment variable VITE_API_URL, falls back to localhost for development
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5200/api";

/**
 * Helper function to build full API URL
 * @param {string} endpoint - API endpoint (e.g., '/families', '/users')
 * @returns {string} - Full API URL
 */
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Default fetch options with authorization
 * @param {string} token - JWT token from auth context
 * @param {object} options - Additional fetch options
 * @returns {object} - Merged fetch options
 */
export const getFetchOptions = (token, options = {}) => {
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };
};

export default API_BASE_URL;
