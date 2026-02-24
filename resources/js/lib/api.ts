import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true,
    timeout: 30000, // 30 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

/**
 * Track whether we have already fetched the CSRF cookie in this session
 * to avoid redundant requests on every mutating call.
 */
let csrfCookieFetched = false;

// ---------------------------------------------------------------------------
// Request interceptor
// ---------------------------------------------------------------------------
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // Let axios auto-set Content-Type for FormData (multipart/form-data with boundary)
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    const mutatingMethods = ['post', 'put', 'patch', 'delete'];

    if (config.method && mutatingMethods.includes(config.method.toLowerCase())) {
        if (!csrfCookieFetched) {
            try {
                await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
                csrfCookieFetched = true;
            } catch (error) {
                // Log error but don't block the request - CSRF might still work from cached cookie
                console.error('Failed to fetch CSRF cookie:', error);
            }
        }

        // Read the XSRF token set by Laravel Sanctum in the cookie
        const xsrfToken = document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

        if (xsrfToken) {
            config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
        }
    }

    return config;
});

// ---------------------------------------------------------------------------
// Response interceptor
// ---------------------------------------------------------------------------
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;

            if (status === 401 || status === 419) {
                csrfCookieFetched = false; // reset so next request fetches a fresh cookie

                // Skip auto-logout for login/auth endpoints to avoid redirect loops
                const url = error.config?.url || '';
                const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/me');

                if (!isAuthEndpoint) {
                    // Dynamically import to avoid circular dependencies
                    const { useAuthStore } = await import('@/stores/authStore');
                    const { logout } = useAuthStore.getState();

                    // Clear auth state
                    logout();

                    // Redirect to login page
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            }
        }

        // Handle network errors or timeout
        if (error.code === 'ECONNABORTED') {
            console.error('Request timeout');
        } else if (!error.response) {
            console.error('Network error - please check your connection');
        }

        return Promise.reject(error);
    },
);

export default api;
