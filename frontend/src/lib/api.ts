import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  
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