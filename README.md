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
