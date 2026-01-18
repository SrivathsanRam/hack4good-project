# Hack4Good Activities Hub

Unified scheduling for participants, volunteers, and staff with a Next.js UI
and an Express + MongoDB API.

## Features
- Shared activity calendar with role-based views (participants, volunteers, staff).
- Volunteer management screen powered by the backend API (live opportunities and shift claiming).
- Staff console for scheduling, capacity tracking, and attendance export.
- Activity detail view with registration flow.
- MongoDB-backed data with a seed script for sample content.

## Tech Stack
- Frontend: Next.js 14, React 18, TypeScript
- Backend: Express.js, TypeScript, Mongoose
- Database: MongoDB

## Prerequisites
- Node.js 18+
- MongoDB (local installation or MongoDB Atlas account)

## Getting Started

### 1. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment variables

Backend (`backend/.env`):
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

Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start MongoDB
If using local MongoDB:
```bash
mongod
```

### 4. Seed the database (optional)
```bash
cd backend
npm run seed
```

### 5. Run the application
```bash
# Start the backend server (from backend folder)
cd backend
npm run dev

# In a new terminal, start the frontend (from frontend folder)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Activities
- GET `/api/activities` - list activities (supports `?program=` and `?role=` filters)
- GET `/api/activities/:id` - get an activity
- POST `/api/activities` - create an activity
- PATCH `/api/activities/:id` - update an activity
- DELETE `/api/activities/:id` - delete an activity

### Registrations
- GET `/api/registrations` - list registrations (supports `?activityId=` filter)
- POST `/api/registrations` - create a registration
- PATCH `/api/registrations/:id` - update attendance
- DELETE `/api/registrations/:id` - delete a registration

### Health
- GET `/api/health` - health check endpoint
- GET `/api/test` - test endpoint

## Project Structure
```
backend/
  src/
    config/
      database.ts
    models/
      Activity.ts
      Registration.ts
      index.ts
    scripts/
      seed.ts
    index.ts
  package.json
frontend/
  src/
    app/
      page.tsx
      calendar/
      admin/
      volunteer/
      participant/
      activity/[id]/
  package.json
types/
  index.ts
```

## Notes
- Data is stored in MongoDB; rerunning `npm run seed` clears and repopulates sample data.
- Frontend API requests use `NEXT_PUBLIC_API_URL`.
- `types/` contains shared TypeScript types (not yet wired across packages).
