const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async signup(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    timezone?: string;
  }) {
    const response = await this.request<{
      token: string;
      user: any;
      message: string;
    }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{
      token: string;
      user: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    timezone?: string;
  }) {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async verifyEmail(token: string) {
    return this.request<{ message: string }>(`/auth/verify?token=${token}`);
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Task endpoints
  async getTasks(params?: {
    categoryId?: number;
    isActive?: boolean;
    isDaily?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.isDaily !== undefined) queryParams.append('isDaily', params.isDaily.toString());
    
    const query = queryParams.toString();
    return this.request<any[]>(`/tasks${query ? `?${query}` : ''}`);
  }

  async getTask(id: number) {
    return this.request<any>(`/tasks/${id}`);
  }

  async createTask(data: {
    title: string;
    description?: string;
    categoryId?: number;
    isDaily?: boolean;
    dueDate?: string;
    reminderEnabled?: boolean;
    reminderTimes?: string[];
    timezone?: string;
    priority?: 'low' | 'medium' | 'high';
    color?: string;
    icon?: string;
  }) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: number, data: Partial<{
    title: string;
    description: string;
    categoryId: number;
    isDaily: boolean;
    dueDate?: string;
    isActive: boolean;
    reminderEnabled: boolean;
    reminderTimes: string[];
    timezone: string;
    priority: 'low' | 'medium' | 'high';
    color: string;
    icon: string;
  }>) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: number) {
    return this.request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async completeTask(id: number, data?: { notes?: string; completionDate?: string }) {
    return this.request<{ message: string; date: string }>(`/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async uncompleteTask(id: number, data?: { completionDate?: string }) {
    return this.request<{ message: string }>(`/tasks/${id}/uncomplete`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  // Category endpoints
  async getCategories() {
    return this.request<any[]>('/categories');
  }

  async getCategory(id: number) {
    return this.request<any>(`/categories/${id}`);
  }

  async createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }) {
    return this.request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(
    id: number,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
    }
  ) {
    return this.request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number) {
    return this.request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics endpoints
  async getDailyStatistics(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.request<any>(`/statistics/daily${query}`);
  }

  async getWeeklyStatistics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return this.request<any>(`/statistics/weekly${query ? `?${query}` : ''}`);
  }

  async getTaskHistory(params?: {
    taskId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.taskId) queryParams.append('taskId', params.taskId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<any[]>(`/statistics/history${query ? `?${query}` : ''}`);
  }

  // Notification endpoints
  async getNotifications(params?: { unreadOnly?: boolean; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<any[]>(`/notifications${query ? `?${query}` : ''}`);
  }

  async getUnreadCount() {
    return this.request<{ unreadCount: number }>('/notifications/unread-count');
  }

  async markNotificationRead(id: number) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(id: number) {
    return this.request<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

