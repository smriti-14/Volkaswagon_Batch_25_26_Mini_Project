# Volkswagen Service Portal

An end-to-end service booking portal that pairs a secure Node.js API with a
responsive, single-page interface. The app supports account registration,
JWT-based login, and a full booking workflow for service intake, edits, and
cancellations.

## Highlights

- Secure auth with JWT, password hashing, rate limiting, and CSP headers.
- Full CRUD workflow for bookings with validation and per-user access control.
- Responsive UI with login/register flow, booking forms, and portal sidebar.
- Optional demo mode for previewing the UI without a backend.
- MongoDB-ready with Docker support for local development.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Security:** Helmet, JWT, bcrypt, express-rate-limit, CORS controls
- **Frontend:** Vanilla HTML/CSS/JS (no framework)
- **Infrastructure:** Docker Compose for MongoDB

## Project Structure

```
.
├─ index.html
├─ styles.css
├─ script.js
├─ server.js
├─ docker-compose.yml
├─ .env.example
└─ package.json
```

## Getting Started

### 1) Configure environment

Copy the example environment file and set a strong JWT secret.

```powershell
Copy-Item .env.example .env
notepad .env
```

Required values:

```
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/vw-service
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=2h
ALLOWED_ORIGINS=
```

### 2) Start MongoDB (Docker)

```powershell
docker-compose up -d
```

### 3) Install and run

```powershell
npm install
npm start
```

Open the app at: `http://localhost:3000`

## Demo Mode (No Backend)

If the backend is unavailable, a demo login can be used to preview the UI.

- **Username:** `demo`
- **Password:** `demo1234`

In demo mode, bookings are stored in `localStorage` on the device.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Bookings (JWT required)

- `GET /api/bookings`
- `POST /api/bookings`
- `PUT /api/bookings/:id`
- `DELETE /api/bookings/:id`

## Security Notes

- JWTs are stored in `sessionStorage` in the browser.
- Set a strong `JWT_SECRET` and run behind HTTPS in production.
- Update `ALLOWED_ORIGINS` if serving the frontend from another origin.

## Production Checklist

- Set `NODE_ENV=production` and a strong `JWT_SECRET`.
- Ensure indexes are created for `users` (email/username) and `bookings`.
- Run behind HTTPS (TLS termination).
- Add observability (structured logs, request IDs, health monitoring).

## Local Troubleshooting

**CORS blocked this request**

- Ensure `ALLOWED_ORIGINS` includes your frontend origin.
- Restart the server after updating `.env`.

**Failed to fetch**

- Make sure the server is running.
- Use `http://localhost:3000` (not `file://`) for the UI.


