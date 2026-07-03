# 🚚 Last Mile Delivery Tracker

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

A modern, robust, and highly aesthetic logistics web application designed to automate, monitor, and optimize last-mile package deliveries. Featuring dynamic volumetric pricing engine, auto-assign dispatch matching, real-time chronological timeline tracking, and three distinct functional portals.

---

## 🌟 Key Features

* **Multi-Role Portals & Dashboards**:
  * 👑 **System Admin Portal**: Force dispatch status overrides, manage delivery agents (update zone, toggle availability status, deactivate profiles), configure areas, operational zones, and rate card matrices, and view total revenue metrics.
  * 📦 **Customer Portal**: Place delivery orders, view instant volumetric price quotes, monitor order histories, and follow package delivery updates.
  * 🏍️ **Delivery Agent Portal**: Manage delivery status pipelines (Picked Up, In Transit, Delivered, Failed, Rescheduled) with live load indicators.
* **Auto-Assign Dispatch Engine**: Automated assignment of orders to the nearest available driver operating in the order's pickup zone with load balancing thresholds.
* **Volumetric Rate Calculator**: Automatically calculates shipping charges based on package dimensional volume ($L \times W \times H$) or actual weight against configurable zone-to-zone base rate cards.
* **Live Chronological Timeline Tracking**: Real-time delivery logs, status updates, and custom operator annotation notes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, TailwindCSS, Axios, Vite, React Router DOM, Lucide Icons |
| **Backend** | Node.js, Express, Prisma ORM, JSON Web Tokens (JWT), Zod Validation |
| **Database** | PostgreSQL (Neon serverless cloud db) |
| **Hosting** | Vercel (Client App), Render (Backend Service) |

---

## 📁 Repository Structure

```text
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── components/     # Shared layout elements (Navbar, Sidebar)
│   │   ├── pages/          # Pages scoped by role (auth, admin, customer, agent)
│   │   ├── services/       # Axios API client middleware
│   │   └── App.jsx         # Routes mapping configuration
│   └── vercel.json         # Vercel deployment rewrite rules proxying /api requests
│
├── server/                 # Express Backend Server API
│   ├── prisma/             # Database schema.prisma definition & seeding scripts
│   ├── config/             # Environment configs & Prisma Client setup
│   ├── controllers/        # Request handling middleware
│   ├── repositories/       # Database abstraction queries logic
│   ├── routes/             # REST route group definitions
│   └── services/           # Business logic & algorithms (pricing, auto-match)
```

---

## 🚀 Local Quickstart Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+)
* [PostgreSQL](https://www.postgresql.org/) database instance

### 1. Clone the repository
```bash
git clone https://github.com/Atulya-arch/last-mile-delivery-tracker.git
cd last-mile-delivery-tracker
```

### 2. Configure Environment Variables
Create a `.env` file inside the `server/` directory:
```env
PORT=5001
DATABASE_URL="postgresql://user:password@localhost:5432/delivery_db?schema=public"
JWT_SECRET="YOUR_SUPER_SECURE_JWT_SECRET_KEY"
JWT_EXPIRES_IN="7d"
```

### 3. Initialize Server and Database
Navigate to the `server/` folder, install dependencies, run migrations, and run the db seeding script:
```bash
cd server
npm install
npx prisma db push
npm run db:seed
npm run dev
```

### 4. Initialize Client App
Open a new terminal window, navigate to the `client/` folder, install dependencies, and run the Vite dev server:
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Demo Test Portals

Use the quick-action buttons on the login screen to auto-fill the pre-seeded credentials for immediate demo testing:

* 👑 **System Admin Dashboard**:
  * **Email**: `admin@example.com`
  * **Password**: `password123`
* 🏍️ **Delivery Agent Dashboard**:
  * **Email**: `john@example.com`
  * **Password**: `john@5432`

