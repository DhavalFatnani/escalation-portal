import { Router } from 'express';

const router = Router();

/**
 * Health Check Endpoint
 * 
 * Purpose: Prevent Render.com cold starts by providing a lightweight endpoint
 * that can be pinged regularly by uptime monitoring services.
 * 
 * This endpoint:
 * - Requires no authentication
 * - Returns minimal data
 * - Responds quickly (no database queries)
 * - Keeps the Render service warm and prevents 15-minute shutdown
 * 
 * Usage: Configure UptimeRobot or similar service to ping every 10 minutes
 * URL: https://your-app.onrender.com/api/health
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;

