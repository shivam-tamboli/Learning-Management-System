# LMS (Learning Management System)

An admin-controlled learning management system built with Next.js, Fastify, and MongoDB.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Fastify, TypeScript |
| Database | MongoDB |
| Auth | JWT |
| Payments | Razorpay |

## Features

- **Admin Dashboard**: Manage courses, modules, videos, and students
- **Student Registration**: Multi-step registration with document upload
- **Course Enrollment**: Admin approves student access to courses
- **Video Playback**: YouTube and local video support with multi-language audio tracks
- **Progress Tracking**: Automatic video completion tracking
- **Document Management**: Upload and manage student documents

## Project Structure

```
LMS MVP/
├── backend/           # Fastify API server
│   └── src/
│       ├── routes/    # API endpoints
│       ├── services/  # Business logic
│       └── db/        # MongoDB connection
└── frontend/          # Next.js application
    └── src/
        └── app/       # App router pages
            ├── admin/       # Admin pages
            └── student/     # Student pages
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB

### Setup

1. **Clone and install dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure environment**
   ```bash
   # backend/.env
   MONGODB_URI=mongodb://localhost:27017/lms
   JWT_SECRET=your-secret
   PORT=3001
   ```

3. **Setup admin user**
   ```bash
   cd backend && npm run setup
   ```

4. **Start servers**
   ```bash
   # Terminal 1 - Backend (port 3001)
   cd backend && npm run dev

   # Terminal 2 - Frontend (port 3000)
   cd frontend && npm run dev
   ```

### Default Admin Credentials

- Email: `admin@lms.com`
- Password: `admin123`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| GET/POST | /api/courses | List/create courses |
| GET/POST | /api/modules | List/create modules |
| GET/POST/PUT/DELETE | /api/videos | Manage videos |
| GET/POST | /api/registration | Student registration |
| POST | /api/payment/init | Initialize payment |

## License

MIT
