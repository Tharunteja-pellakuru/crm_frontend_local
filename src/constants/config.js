// Central configuration for API and other constants
// export const BASE_URL = "http://localhost:5000";

export const BASE_URL = "https://crm-backend-local-vz9l.onrender.com";

// API Endpoints
export const API_ENDPOINTS = {
  ADMIN_USERS: `${BASE_URL}/api/admin-users`,
  UPDATE_ADMIN: (id) => `${BASE_URL}/api/admin-users/update/${id}`,
};

export default {
  BASE_URL,
  API_ENDPOINTS,
};
