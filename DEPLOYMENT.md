# Deployment Guide: Last Mile Delivery Tracker

This guide details how to deploy the modular monolithic Last Mile Delivery Tracker to production using Vercel (Frontend) and Render/Railway (Backend).

---

## 1. Backend Deployment (Render or Railway)

The Express backend application resides in the `server/` directory and connects to a PostgreSQL database.

### Environment Variables
Configure the following environment variables in your Render/Railway dashboard:
* `NODE_ENV`: `production`
* `PORT`: `5000` (or leave to platform default)
* `DATABASE_URL`: `postgresql://<user>:<password>@<host>:<port>/<database>?schema=public` (Your hosted PostgreSQL connection string)
* `JWT_SECRET`: `your-random-super-secret-key-at-least-32-chars`
* `JWT_EXPIRES_IN`: `7d`
* `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (Optional SMTP details for email notification updates)

### Build & Start Configurations (Render Example)
- **Root Directory**: `server`
- **Build Command**: `npm install && npx prisma generate` (Installs dependencies and compiles the Prisma client matching your hosted database type)
- **Start Command**: `npx prisma migrate deploy && npx prisma db seed && npm start`
  *(Note: Running `prisma migrate deploy` applies migrations to the database and `db seed` initializes dynamic configs like `VOLUMETRIC_DIVISOR` and `MAX_DRIVER_LOAD` in the PostgreSQL database automatically upon startup).*

---

## 2. Frontend Deployment (Vercel)

The React SPA client resides in the `client/` directory and communicates with the backend APIs.

### Routing Redirects Config
A `vercel.json` file is located in `client/vercel.json` to handle SPA path rewrites:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-backend-url.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
*Replace `https://your-backend-url.onrender.com` with your actual live backend endpoint URL.*

### Vercel Dashboard Settings
1. Import your repository on Vercel.
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Ensure the **Build Command** is `npm run build` and **Output Directory** is `dist`.
5. Deploy! Vercel will handle building assets and serve your React app securely.
