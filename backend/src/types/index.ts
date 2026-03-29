export interface User {
  _id?: any;
  name: string;
  email: string;
  password: string;
  role: "admin" | "student";
  approved: boolean;
}

export interface Course {
  _id?: any;
  title: string;
  description: string;
}

export interface Module {
  _id?: any;
  courseId: string;
  title: string;
}

export interface Video {
  _id?: any;
  moduleId: string;
  title: string;
  youtubeUrl: string;
  duration?: number;
  thumbnail?: string;
  description?: string;
  order?: number;
}

export interface Registration {
  _id?: any;
  studentId?: string;
  courseIds: string[];
  basicDetails?: {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    email?: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  contact?: {
    phone: string;
    emergencyContact: string;
    emergencyName?: string;
    relationship?: string;
  };
  education?: {
    qualification: string;
    institution: string;
    year: string;
    percentage?: string;
  };
  health?: {
    conditions: string;
    medications: string;
    allergies?: string;
  };
  payment?: {
    amount?: number;
    status?: string;
    reference?: string;
    notes?: string;
  };
  status: "draft" | "pending" | "approved" | "rejected";
  currentStep?: number;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;
  previouslyRejected?: boolean;
  rejectedAt?: Date;
  approvedAt?: Date;
}

export interface Document {
  _id?: any;
  studentId: string;
  filePath: string;
  type: string;
}

export interface Payment {
  _id?: any;
  studentId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  razorpayId?: string;
}

export interface Progress {
  _id?: any;
  studentId: string;
  courseId: string;
  videoId: string;
  videoDuration?: number;
  watchTime?: number;
  isCompleted: boolean;
  completionPercentage?: number;
  startedAt?: Date;
  lastWatchedAt?: Date;
  completedAt?: Date;
  lastPlayheadPosition?: number;
}

export interface CourseProgress {
  _id?: any;
  studentId: string;
  courseId: string;
  totalVideos?: number;
  completedVideos?: number;
  totalWatchTime?: number;
  requiredWatchTime?: number;
  overallProgress?: number;
  status?: "in_progress" | "completed" | "dropped";
  enrolledAt?: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
}