<<<<<<< HEAD
# Hack4Good Activities Hub

Unified scheduling for participants, volunteers, and staff with a Next.js UI
and an Express API. The frontend now pulls volunteer opportunities from the
backend and posts volunteer signups to the registrations endpoint.

## Features
- Shared activity calendar with role-based views (participants, volunteers, staff).
- Volunteer management screen powered by the backend API (live opportunities and shift claiming).
- Staff console for scheduling, capacity tracking, and attendance export (prototype UI).
- Activity detail view with registration flow (prototype UI).
- Clear, styled UI with filters, stats, and capacity indicators.

## Solution Overview
- `backend/` hosts an Express API with in-memory activity and registration data.
- `frontend/` is a Next.js app (App Router) that renders the UI and calls the API.
- `types/` contains shared TypeScript types (not yet wired across packages).

## Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

The API defaults to `http://localhost:5000`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Optional environment variable for API base URL:
```bash
set NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Open `http://localhost:3000`.

## API Endpoints (Backend)
- `GET /api/health` - health check
- `GET /api/activities` - list activities, supports `program` and `role` query params
- `GET /api/activities/:id` - activity detail
- `POST /api/activities` - create an activity
- `PATCH /api/activities/:id` - update an activity
- `GET /api/registrations` - list registrations, supports `activityId`
- `POST /api/registrations` - create a registration
- `PATCH /api/registrations/:id` - update attendance

## Volunteer Management Flow
- The volunteer view loads live activities from `GET /api/activities?role=Volunteers`.
- Claiming a shift posts to `POST /api/registrations` and reduces `seatsLeft` locally.
- Preferences (cadence, time of day, program) filter visible opportunities.

## Project Structure
```
backend/     Express + TypeScript API
frontend/    Next.js UI
types/       Shared TypeScript types
```

## Notes
- The backend stores data in-memory for this prototype. Restarting the server resets data.
- The staff console and activity detail screens still use sample data; only the volunteer view is wired to the API.
=======
# Hack4Good - Activity Management System

A unified activity calendar for managing participants, volunteers, and staff schedules.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Express.js, TypeScript, MongoDB with Mongoose
- **Database**: MongoDB

## Prerequisites

- Node.js 18+ 
- MongoDB (local installation or MongoDB Atlas account)

## Getting Started

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

#### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/hack4good
```

For MongoDB Atlas, replace `MONGODB_URI` with your connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hack4good
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start MongoDB

If using local MongoDB:
```bash
mongod
```

### 4. Seed the Database (Optional)

To populate the database with sample data:
```bash
cd backend
npm run seed
```

### 5. Run the Application

```bash
# Start the backend server (from backend folder)
cd backend
npm run dev

# In a new terminal, start the frontend (from frontend folder)
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## API Endpoints

### Activities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activities` | Get all activities (supports `?program=` and `?role=` filters) |
| GET | `/api/activities/:id` | Get a specific activity |
| POST | `/api/activities` | Create a new activity |
| PATCH | `/api/activities/:id` | Update an activity |
| DELETE | `/api/activities/:id` | Delete an activity |

### Registrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registrations` | Get all registrations (supports `?activityId=` filter) |
| POST | `/api/registrations` | Create a new registration |
| PATCH | `/api/registrations/:id` | Update registration attendance |
| DELETE | `/api/registrations/:id` | Delete a registration |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check endpoint |
| GET | `/api/test` | Test endpoint |

## Project Structure

```
hack4good/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts      # MongoDB connection
│   │   ├── models/
│   │   │   ├── Activity.ts      # Activity model
│   │   │   ├── Registration.ts  # Registration model
│   │   │   └── index.ts         # Model exports
│   │   ├── scripts/
│   │   │   └── seed.ts          # Database seeding script
│   │   └── index.ts             # Express server entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx         # Home page
│   │       ├── calendar/        # Calendar view
│   │       ├── admin/           # Admin console
│   │       ├── volunteer/       # Volunteer view
│   │       └── activity/[id]/   # Activity detail & registration
│   └── package.json
└── types/
    └── index.ts                 # Shared TypeScript types
```

## Features

- **Calendar View**: Browse activities by program and role
- **Admin Console**: Create and manage activities, track attendance
- **Registration**: Register participants and volunteers for activities
- **Attendance Tracking**: Mark attendance and export CSV reports
>>>>>>> def313e1a92930bec4bfed74d499b6e46189777b
