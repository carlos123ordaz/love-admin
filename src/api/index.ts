import axios from 'axios';
import { auth } from '../utils/firebase';
import type {
    ApiResponse,
    DashboardStats,
    User,
    PageItem,
    PageDetail,
    Contact,
    Pagination,
} from '../types';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 15000,
});

// Interceptor: adjuntar token de Firebase en cada request
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor: manejar errores globales
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado o inválido
            auth.signOut();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==================== AUTH ====================
export const authApi = {
    getMe: () => api.get<ApiResponse<User & { isAdmin: boolean }>>('/auth/me'),
};

// ==================== DASHBOARD ====================
export const dashboardApi = {
    getStats: () => api.get<ApiResponse<DashboardStats>>('/admin/dashboard'),
};

// ==================== USERS ====================
export const usersApi = {
    getAll: (params: {
        page?: number;
        limit?: number;
        search?: string;
        isPro?: string;
        sortBy?: string;
        order?: string;
    }) =>
        api.get<ApiResponse<User[]> & { pagination: Pagination }>('/admin/users', { params }),

    getById: (userId: string) =>
        api.get<ApiResponse<{ user: User; pages: PageItem[] }>>(`/admin/users/${userId}`),
};

// ==================== PAGES ====================
export const pagesApi = {
    getAll: (params: {
        page?: number;
        limit?: number;
        search?: string;
        pageType?: string;
        isActive?: string;
        sortBy?: string;
        order?: string;
    }) =>
        api.get<ApiResponse<PageItem[]> & { pagination: Pagination }>('/admin/pages', { params }),

    getById: (pageId: string) =>
        api.get<ApiResponse<PageDetail>>(`/admin/pages/${pageId}`),

    toggle: (pageId: string) =>
        api.patch<ApiResponse<{ _id: string; isActive: boolean }>>(`/admin/pages/${pageId}/toggle`),

    delete: (pageId: string) => api.delete(`/admin/pages/${pageId}`),
};

// ==================== CONTACTS ====================
export const contactsApi = {
    getAll: (params: {
        page?: number;
        limit?: number;
        status?: string;
        type?: string;
        search?: string;
        sortBy?: string;
        order?: string;
    }) =>
        api.get<ApiResponse<Contact[]> & { pagination: Pagination }>('/admin/contacts', { params }),

    getById: (contactId: string) =>
        api.get<ApiResponse<Contact>>(`/admin/contacts/${contactId}`),

    update: (contactId: string, data: { status?: string; adminNotes?: string }) =>
        api.patch<ApiResponse<Contact>>(`/admin/contacts/${contactId}`, data),

    delete: (contactId: string) => api.delete(`/admin/contacts/${contactId}`),
};

export default api;