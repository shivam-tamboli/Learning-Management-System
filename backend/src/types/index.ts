export interface User {
  _id?: any;
  name: string;
  email: string;
  password: string;
  role: "admin" | "student";
  approved: boolean;
}

export interface Session {
  _id?: any;
  userId: any;
  refreshTokenHash: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  expiresAt: Date;
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
}

export interface Registration {
  _id?: any;
  studentId: string;
  courseIds: string[];
  basicDetails: {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  contact: {
    phone: string;
    emergencyContact: string;
  };
  education: {
    qualification: string;
    institution: string;
    year: string;
  };
  health: {
    conditions: string;
    medications: string;
  };
  status: "pending" | "approved" | "rejected";
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
  isCompleted: boolean;
}