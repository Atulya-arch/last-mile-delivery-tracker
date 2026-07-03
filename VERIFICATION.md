# How to Verify the Application is Working

This document details the step-by-step process to run, initialize, and test the Last Mile Delivery Tracker application locally.

---

## Step 1: Initialize the Database (Prisma)

1. Rename the `.env.example` in the `server/` directory to `.env`:
   ```bash
   cp server/.env.example server/.env
   ```
2. Update the `DATABASE_URL` in `server/.env` to point to your local or hosted PostgreSQL instance.
3. Run the migrations to initialize tables:
   ```bash
   cd server
   npx prisma migrate dev --name init
   ```
4. Run the seed script to populate configuration settings, initial zones, areas, and rate cards:
   ```bash
   npm run db:seed
   ```

---

## Step 2: Spin Up the Application Services

You will need to open two terminal windows or background tasks:

### Terminal A: Start the Backend Server (Express)
```bash
cd server
npm run dev
```
*This starts the Express backend API on **http://localhost:5000**.*

### Terminal B: Start the Frontend Application (Vite React)
```bash
cd client
npm run dev
```
*This starts the Vite server on **http://localhost:3000**.*

---

## Step 3: Run the Health Check Verification

Before testing the UI, call the backend health check to verify database connectivity:

Open your browser or run in terminal:
```bash
curl http://localhost:5000/health
```
**Expected Response (200 OK)**:
```json
{
  "status": "UP",
  "database": "CONNECTED",
  "timestamp": "2026-07-03T12:26:54.000Z"
}
```
*(If database status says CONNECTED, the server and DB are integrated perfectly).*

---

## Step 4: Step-by-Step UI Verification Flow

Open your browser to **http://localhost:3000** and perform the following flow:

### 1. Register a Customer & Agent
* Go to the sign-up page (`/register`).
* Select **Role: Customer** and sign up as "Alice Customer" (alice@example.com / password123).
* Logout, go back to sign-up, select **Role: Delivery Agent** and sign up as "Bob Agent" (bob@example.com / password123). Enter mock license: `LIC-AGENT-8899` and vehicle: `Bike`.

### 2. Log in and Configure Agent Zone & Status
* Log in as **Bob Agent**.
* On Bob's dashboard, toggle his status from `OFFLINE` to `AVAILABLE`.
* Select his operating zone to match **North Zone** from the dropdown menu.
* Log out.

### 3. Log in as Customer & Place Order
* Log in as **Alice Customer**.
* Go to **Place Order**.
* Select **Pickup Area: Downtown** (mapped to North Zone) and **Delivery Area: Airport** (mapped to North Zone).
* Enter package metrics (e.g. Length: 10, Width: 10, Height: 10, Weight: 1.5).
* Click **Calculate Quote** — the pricing breakdown card will display the calculated volumetric/billable weight and base pricing.
* Click **Confirm & Place Order**.
* Look at the Customer Dashboard. You will see your order code (e.g., `DT-XXXXXX`). Click **Track** to view the timeline. Since Bob Agent is online and available in the same North Zone, the order status will have auto-transitioned from `CREATED` to `ASSIGNED` automatically!

### 4. Progress Order Delivery as Agent
* Log back in as **Bob Agent**.
* You will see the assigned order on Bob's Dashboard.
* Click **Update Status** to transition:
  * `ASSIGNED` ➔ `PICKED_UP`
  * `PICKED_UP` ➔ `IN_TRANSIT`
  * `IN_TRANSIT` ➔ `OUT_FOR_DELIVERY`
  * `OUT_FOR_DELIVERY` ➔ `DELIVERED` (completed) or `FAILED` (delivery failed, select reason).
* If you set status to `FAILED`, log out.

### 5. Reschedule Failed Order as Customer
* Log back in as **Alice Customer**.
* View the failed order detail timeline.
* You will see a **Reschedule Delivery** card. Enter special instructions and confirm rescheduling.
* The order status resets to `CREATED` and auto-matching runs again.
