const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Helper function to verify user exists
async function verifyUser(userId) {
    try {
        const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        throw error;
    }
}

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Get all routes
 *     tags: [Routes]
 *     description: Retrieve a list of all routes with filtering, sorting, and pagination
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Filter by origin location (partial match)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Filter by destination location (partial match)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [proposed, active, completed, cancelled]
 *         description: Filter by route status
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by semester (e.g., "Fall 2025")
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: integer
 *         description: Filter by creator user ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field (default: created_at)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort order (default: DESC)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination (default: 1)
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *         description: Number of items per page (default: 20)
 *     responses:
 *       200:
 *         description: List of routes retrieved successfully (with pagination metadata)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Route'
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const { from, to, status, semester, createdBy, sortBy, sortOrder, page, page_size } = req.query;

        const filters = {
            from,
            to,
            status,
            semester,
            createdBy,
            sortBy,
            sortOrder,
            page,
            page_size
        };

        // Pagination + Query Parameters
        const result = await Route.findAll(filters);
        res.json(result);
    } catch (error) {
        console.error('GET /api/routes error:', error);
        res.status(500).json({ error: 'Failed to fetch routes', message: error.message });
    }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   get:
 *     summary: Get route by ID
 *     tags: [Routes]
 *     description: Retrieve a specific route by its ID with eTag support
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route retrieved successfully
 *         headers:
 *           ETag:
 *             schema:
 *               type: string
 *             description: Entity tag for cache validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        // eTag processing
        res.setHeader('ETag', route.etag);
        res.json(route);
    } catch (error) {
        console.error(`GET /api/routes/${req.params.id} error:`, error);
        res.status(500).json({ error: 'Failed to fetch route', message: error.message });
    }
});

/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Create a new route proposal
 *     tags: [Routes]
 *     description: Create a new route proposal in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromLocation
 *               - toLocation
 *               - scheduleDays
 *               - morningTime
 *               - eveningTime
 *               - semester
 *               - createdBy
 *             properties:
 *               fromLocation:
 *                 type: string
 *                 example: "Columbia University"
 *               toLocation:
 *                 type: string
 *                 example: "Flushing, Queens"
 *               scheduleDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
 *               morningTime:
 *                 type: string
 *                 format: time
 *                 example: "08:00:00"
 *               eveningTime:
 *                 type: string
 *                 format: time
 *                 example: "18:30:00"
 *               semester:
 *                 type: string
 *                 example: "Fall 2025"
 *               requiredMembers:
 *                 type: integer
 *                 example: 15
 *               estimatedCost:
 *                 type: number
 *                 example: 120.00
 *               description:
 *                 type: string
 *               createdBy:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Route created successfully
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: URI of the created route
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Route'
 *       400:
 *         description: Invalid input or user not found
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
    try {
        const {
            fromLocation,
            toLocation,
            scheduleDays,
            morningTime,
            eveningTime,
            semester,
            requiredMembers,
            estimatedCost,
            description,
            createdBy
        } = req.body;

        if (!fromLocation || !toLocation || !scheduleDays || !morningTime || !eveningTime || !semester || !createdBy) {
            return res.status(400).json({
                error: 'Missing required fields: fromLocation, toLocation, scheduleDays, morningTime, eveningTime, semester, createdBy'
            });
        }

        if (!Array.isArray(scheduleDays) || scheduleDays.length === 0) {
            return res.status(400).json({ error: 'scheduleDays must be a non-empty array' });
        }

        const user = await verifyUser(createdBy);
        if (!user) {
            return res.status(400).json({ error: 'Creator user not found' });
        }

        const newRoute = await Route.create({
            fromLocation,
            toLocation,
            scheduleDays,
            morningTime,
            eveningTime,
            semester,
            requiredMembers,
            estimatedCost,
            description,
            createdBy
        });

        // HTTP 201 Created with Location header
        res.setHeader('Location', `/api/routes/${newRoute.id}`);
        res.status(201).json(newRoute);
    } catch (error) {
        console.error('POST /api/routes error:', error);
        res.status(500).json({ error: 'Failed to create route', message: error.message });
    }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   put:
 *     summary: Update a route
 *     tags: [Routes]
 *     description: Update an existing route with eTag validation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *       - in: header
 *         name: If-Match
 *         schema:
 *           type: string
 *         description: ETag value for optimistic locking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromLocation:
 *                 type: string
 *               toLocation:
 *                 type: string
 *               scheduleDays:
 *                 type: array
 *                 items:
 *                   type: string
 *               morningTime:
 *                 type: string
 *               eveningTime:
 *                 type: string
 *               semester:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Route updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route not found
 *       412:
 *         description: Precondition Failed - ETag mismatch
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        // Sprint 2: eTag validation with If-Match header
        const ifMatch = req.headers['if-match'];

        try {
            const updatedRoute = await Route.update(req.params.id, req.body, ifMatch);
            res.json(updatedRoute);
        } catch (error) {
            if (error.message === 'ETag mismatch - resource has been modified') {
                return res.status(412).json({
                    error: 'Precondition Failed',
                    message: 'The route has been modified by another request. Please fetch the latest version and try again.'
                });
            }
            throw error;
        }
    } catch (error) {
        console.error(`PUT /api/routes/${req.params.id} error:`, error);
        res.status(500).json({ error: 'Failed to update route', message: error.message });
    }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   delete:
 *     summary: Delete a route
 *     tags: [Routes]
 *     description: Delete a route from the system
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route deleted successfully
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        await Route.delete(req.params.id);
        res.json({ message: 'Route deleted successfully' });
    } catch (error) {
        console.error(`DELETE /api/routes/${req.params.id} error:`, error);
        res.status(500).json({ error: 'Failed to delete route', message: error.message });
    }
});

/**
 * @swagger
 * /api/routes/{id}/status:
 *   patch:
 *     summary: Update route status
 *     tags: [Routes]
 *     description: Update only the status of a route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [proposed, active, completed, cancelled]
 *     responses:
 *       200:
 *         description: Route status updated successfully
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['proposed', 'active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                validStatuses
            });
        }

        const route = await Route.findById(req.params.id);
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        const updatedRoute = await Route.updateStatus(req.params.id, status);
        res.json(updatedRoute);
    } catch (error) {
        console.error(`PATCH /api/routes/${req.params.id}/status error:`, error);
        res.status(500).json({ error: 'Failed to update route status', message: error.message });
    }
});

/**
 * @swagger
 * /api/routes/{id}/join:
 *   post:
 *     summary: Join a route
 *     tags: [Routes]
 *     description: Add a user to a route's member list
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Successfully joined route
 *       400:
 *         description: User already a member or user not found
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.post('/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const route = await Route.findById(req.params.id);
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        const user = await verifyUser(userId);
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const isMember = await Route.isMember(req.params.id, userId);
        if (isMember) {
            return res.status(400).json({ error: 'User is already a member of this route' });
        }

        const updatedRoute = await Route.addMember(req.params.id, userId);
        res.json({
            message: 'Successfully joined route',
            route: updatedRoute
        });
    } catch (error) {
        console.error(`POST /api/routes/${req.params.id}/join error:`, error);
        res.status(500).json({ error: 'Failed to join route', message: error.message });
    }
});

/**
 * @swagger
 * /api/routes/{id}/leave:
 *   delete:
 *     summary: Leave a route
 *     tags: [Routes]
 *     description: Remove a user from a route's member list
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: Successfully left route
 *       400:
 *         description: User is not a member
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/leave', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const route = await Route.findById(req.params.id);
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        const isMember = await Route.isMember(req.params.id, userId);
        if (!isMember) {
            return res.status(400).json({ error: 'User is not a member of this route' });
        }

        const updatedRoute = await Route.removeMember(req.params.id, userId);
        res.json({
            message: 'Successfully left route',
            route: updatedRoute
        });
    } catch (error) {
        console.error(`DELETE /api/routes/${req.params.id}/leave error:`, error);
        res.status(500).json({ error: 'Failed to leave route', message: error.message });
    }
});

/**
 * @swagger
 * /api/routes/{id}/members:
 *   get:
 *     summary: Get route members
 *     tags: [Routes]
 *     description: Retrieve list of users who are members of a route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter members by status
 *     responses:
 *       200:
 *         description: List of members retrieved successfully
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.get('/:id/members', async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        const { status } = req.query;
        const filters = { status };

        // Query parameters for sub-collections
        const members = await Route.getMembers(req.params.id, filters);
        res.json({
            routeId: parseInt(req.params.id),
            totalMembers: members.length,
            members
        });
    } catch (error) {
        console.error(`GET /api/routes/${req.params.id}/members error:`, error);
        res.status(500).json({ error: 'Failed to fetch route members', message: error.message });
    }
});

// In-memory store for activation tasks
const activationTasks = {};

/**
 * @swagger
 * /api/routes/{id}/activate:
 *   post:
 *     summary: Asynchronously activate a route
 *     tags: [Routes]
 *     description: Starts an asynchronous process to activate a route and returns a task ID for polling.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID to activate
 *     responses:
 *       202:
 *         description: Accepted for processing.
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: URL to poll for activation status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "pending"
 *                 statusUrl:
 *                   type: string
 *                   description: URL to poll for status updates
 *       404:
 *         description: Route not found
 *       400:
 *         description: Route cannot be activated (e.g., already active)
 */
router.post('/:id/activate', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (route.status === 'active') {
      return res.status(400).json({ error: 'Route is already active' });
    }

    if (route.currentMembers < route.requiredMembers) {
      return res.status(400).json({ 
        error: 'Route does not have enough members to activate',
        currentMembers: route.currentMembers,
        requiredMembers: route.requiredMembers
      });
    }

    const taskId = `activation-${req.params.id}-${Date.now()}`;
    activationTasks[taskId] = { 
      status: 'pending', 
      routeId: req.params.id,
      startedAt: new Date().toISOString(),
      details: 'Activation checks are running.' 
    };

    // Simulate async processing
    setTimeout(async () => {
      try {
        // Perform activation checks asynchronously
        
        await Route.updateStatus(req.params.id, 'active');
        
        activationTasks[taskId] = {
          status: 'success',
          routeId: req.params.id,
          startedAt: activationTasks[taskId].startedAt,
          completedAt: new Date().toISOString(),
          details: 'Route successfully activated',
          route: await Route.findById(req.params.id)
        };
      } catch (error) {
        activationTasks[taskId] = {
          status: 'failed',
          routeId: req.params.id,
          startedAt: activationTasks[taskId].startedAt,
          completedAt: new Date().toISOString(),
          details: `Activation failed: ${error.message}`,
          error: error.message
        };
      }
    }, 3000); // Simulate 3 second processing time

    const statusUrl = `/api/route-activations/${taskId}`;
    
    // HTTP 202 Accepted with async + polling
    res.status(202)
       .setHeader('Location', statusUrl)
       .json({ 
         taskId, 
         status: 'pending',
         statusUrl,
         message: 'Route activation has been queued for processing'
       });
  } catch (error) {
    console.error(`POST /api/routes/${req.params.id}/activate error:`, error);
    res.status(500).json({ error: 'Failed to queue route activation', message: error.message });
  }
});

/**
 * @swagger
 * /api/route-activations/{taskId}:
 *   get:
 *     summary: Get activation task status
 *     tags: [Routes]
 *     description: Poll the status of an asynchronous route activation task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activation task ID
 *     responses:
 *       200:
 *         description: Task status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, success, failed]
 *                 routeId:
 *                   type: integer
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 completedAt:
 *                   type: string
 *                   format: date-time
 *                 details:
 *                   type: string
 *                 route:
 *                   $ref: '#/components/schemas/Route'
 *       404:
 *         description: Task not found
 */
router.get('/route-activations/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = activationTasks[taskId];
  
  if (!task) {
    return res.status(404).json({ error: 'Activation task not found' });
  }
  
  res.json({
    taskId,
    ...task
  });
});

module.exports = router;