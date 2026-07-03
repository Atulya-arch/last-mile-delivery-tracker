import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './middleware/errorHandler.js';
import prisma from './config/prismaClient.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/health', async (req, res, next) => {
  try {
    // Basic test of database connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fallback Route for Undefined Paths
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Last Mile Delivery Tracker Server running on port ${PORT} in ${env.NODE_ENV} mode.`);
});
