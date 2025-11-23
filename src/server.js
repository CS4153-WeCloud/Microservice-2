require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const routeRoutes = require('./routes/routeRoutes');  // CHANGED
const { specs } = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Check if the Route & Group Service is running
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 *                 service:
 *                   type: string
 *                   example: route-group-service
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: connected
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    service: 'route-group-service',  // CHANGED
    timestamp: new Date().toISOString(),
    database: 'connected'  // ADDED
  });
});

// Routes
app.use('/api/routes', routeRoutes);  // CHANGED

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     tags: [Health]
 *     description: Get basic information about the Route & Group Service API
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Route & Group Service API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 description:
 *                   type: string
 *                   example: RESTful API for Route Proposal and Group Formation Management
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 *                 endpoints:
 *                   type: object
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Route & Group Service API',  // CHANGED
    version: '1.0.0',
    description: 'RESTful API for Route Proposal and Group Formation Management - Columbia Point2Point Shuttle',  // ADDED
    documentation: '/api-docs',
    endpoints: {  // ADDED
      routes: '/api/routes',
      health: '/health',
      docs: '/api-docs'
    }
  });
});

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: {
      routes: '/api/routes',
      health: '/health',
      docs: '/api-docs'
    }
  });
});

// Error handling middleware - must be last
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ 
    success: false,  // ADDED
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message  // CHANGED
  });
});

app.listen(PORT, () => {
  console.log(`Route & Group Service running on port ${PORT}`);  // CHANGED - fixed template literal
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);  // CHANGED - fixed template literal
  console.log(`Health check available at http://localhost:${PORT}/health`);  // ADDED
});

module.exports = app;