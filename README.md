# Learning Management System

Full-stack LMS built during an internship at MIT World Peace University. Admins manage courses, modules, videos, and student registrations; students access enrolled content, track progress, and upload documents.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | TypeScript, Fastify, MongoDB |
| Auth | JWT, bcryptjs |
| File uploads | Multipart (videos, documents — up to 10 MB) |
| Rate limiting | @fastify/rate-limit per-route |
| Notifications | MSG91 (SMS and WhatsApp) |
| Frontend | Next.js, Tailwind CSS |

## Features

**Admin:** create and manage courses, modules, videos, and documents; register students to courses; record and track payments; view all user accounts.

**Student:** browse enrolled courses, watch videos, download documents, track progress per module, upload documents.

**Auth:** JWT-based authentication with role-based route guards (admin vs student). Admin account setup via a CLI setup script.

## Architecture

```
backend/src/
├── routes/
│   ├── auth.ts          # Login, token validation
│   ├── users.ts         # User CRUD (admin only)
│   ├── courses.ts       # Course management
│   ├── modules.ts       # Module management
│   ├── videos.ts        # Video upload and serving
│   ├── documents.ts     # Document upload and download
│   ├── registration.ts  # Student course enrollment
│   ├── progress.ts      # Module completion tracking
│   └── payments.ts      # Payment recording (admin)
├── db/                  # MongoDB connection
├── config/              # Rate limit configuration
└── utils/               # Error handling, helpers

frontend/src/
├── app/                 # Next.js App Router pages
├── components/          # UI components
├── hooks/               # Custom React hooks
└── lib/                 # API client, utilities
```

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run setup
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000, backend at http://localhost:3001.

## Environment variables

| Variable | Description |
|---|---|
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Secret for signing tokens |
| PORT | Backend port (default: 3001) |
| MSG91_AUTH_KEY | MSG91 key for SMS/WhatsApp notifications |
| MSG91_SENDER_ID | MSG91 sender ID |
| LMS_URL | Frontend URL (used in notification links) |

## License

MIT
