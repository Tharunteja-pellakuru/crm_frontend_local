// Central configuration for API and other constants
// export const BASE_URL = "https://crmadmin.whysocial.in";
export const BASE_URL = "http://localhost:5001";

// API Endpoints
export const API_ENDPOINTS = {
  ADMIN_USERS: `${BASE_URL}/api/admin-users`,
  UPDATE_ADMIN: (id) => `${BASE_URL}/api/admin-users/update/${id}`,
};

export const GOOGLE_CLIENT_ID = "774870383912-a71ldaj2fqmposgjcp66fqvebp3ae57f.apps.googleusercontent.com"; // Replace with actual Client ID

export default {
  BASE_URL,
  API_ENDPOINTS,
};
