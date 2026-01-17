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
