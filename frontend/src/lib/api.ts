import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const { accessToken } = response.data;
    
    if (accessToken) {
      localStorage.setItem("token", accessToken);
      return accessToken;
    }
    return null;
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    return null;
  }
};

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          onRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
  
  logout: (refreshToken: string) =>
    api.post("/auth/logout", { refreshToken }),
  
  register: (data: { name: string; email: string; password: string; role: string }) =>
    api.post("/auth/register", data),
};

export const userService = {
  getCurrentUser: () => api.get("/users/me"),
  getAllUsers: () => api.get("/users"),
  create: (data: { name: string; email: string; password: string; role?: string; approved?: boolean }) =>
    api.post("/users", data),
  update: (id: string, data: { name?: string; email?: string; role?: string; approved?: boolean }) =>
    api.put(`/users/${id}`, data),
  approveUser: (id: string, approved: boolean) =>
    api.put(`/users/${id}/approve`, { approved }),
};

export const courseService = {
  getAll: () => api.get("/courses"),
  getEnrolled: () => api.get("/courses/enrolled"),
  getById: (id: string) => api.get(`/courses/${id}`),
  create: (data: { title: string; description: string }) =>
    api.post("/courses", data),
  delete: (id: string) => api.delete(`/courses/${id}`),
  createModule: (data: { courseId: string; title: string }) =>
    api.post("/modules", data),
  deleteModule: (id: string) => api.delete(`/modules/${id}`),
  createVideo: (data: { moduleId: string; title: string; youtubeUrl: string }) =>
    api.post("/videos", data),
  deleteVideo: (id: string) => api.delete(`/videos/${id}`),
};

export const moduleService = {
  getByCourse: (courseId: string) => api.get(`/modules?courseId=${courseId}`),
  create: (data: { courseId: string; title: string }) =>
    api.post("/modules", data),
  delete: (id: string) => api.delete(`/modules/${id}`),
};

export const videoService = {
  getByModule: (moduleId: string) => api.get(`/videos?moduleId=${moduleId}`),
  create: (data: { moduleId: string; title: string; youtubeUrl: string }) =>
    api.post("/videos", data),
  delete: (id: string) => api.delete(`/videos/${id}`),
};

export const registrationService = {
  getAll: () => api.get("/registration"),
  getById: (id: string) => api.get(`/registration/${id}`),
  saveStep: (data: any) => api.post("/registration/step", data),
  updateStudent: (id: string, studentId: string) =>
    api.put(`/registration/${id}/student`, { studentId }),
  updatePayment: (id: string, payment: { amount: number; status: string; reference?: string }) =>
    api.put(`/registration/${id}/payment`, { payment }),
  updateStatus: (id: string, action: "approve" | "reject") =>
    api.post(`/registration/${id}/status`, { action }),
  update: (id: string, data: { basicDetails?: any; address?: any; contact?: any; education?: any; health?: any; payment?: any; courseIds?: string[] }) =>
    api.put(`/registration/${id}`, data),
  updateUser: (id: string, userData: { name?: string; phone?: string; address?: any }) =>
    api.put(`/registration/${id}/user`, { userData }),
  delete: (id: string) => api.delete(`/registration/${id}`),
};

export const paymentService = {
  getAll: (studentId?: string) =>
    api.get(`/payment${studentId ? `?studentId=${studentId}` : ""}`),
  create: (data: { studentId: string; amount: number; status?: string }) =>
    api.post("/payment", data),
  update: (id: string, status: string) =>
    api.put(`/payment/${id}`, { status }),
  getByStudent: (studentId: string) =>
    api.get(`/payment/student/${studentId}`),
};

export const progressService = {
  getByCourse: (courseId: string) => api.get(`/progress/${courseId}`),
  complete: (data: { courseId: string; videoId: string }) =>
    api.post("/progress/complete", data),
  getAll: (studentId?: string) =>
    api.get(`/progress${studentId ? `?studentId=${studentId}` : ""}`),
};

const getAuthHeader = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  return {};
};

export const documentService = {
  getByStudent: (studentId: string) => api.get(`/documents?studentId=${studentId}`),
  getByRegistration: (registrationId: string) => api.get(`/documents?registrationId=${registrationId}`),
  upload: (formData: FormData) => {
    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/documents`, {
      method: "POST",
      headers,
      body: formData,
    }).then((res) => res.json());
  },
  delete: (id: string) => api.delete(`/documents/${id}`),
};