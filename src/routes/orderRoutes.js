const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
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
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     description: Retrieve a list of all orders
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter orders by user ID
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    let orders;
    if (userId) {
      orders = Order.findByUserId(userId);
    } else {
      orders = Order.findAll();
    }
    
    res.json(orders);
  } catch (error) {
    console.error('GET /api/orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders', message: error.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     description: Retrieve a specific order by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error(`GET /api/orders/${req.params.id} error:`, error);
    res.status(500).json({ error: 'Failed to fetch order', message: error.message });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     description: Create a new order in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - items
 *               - totalAmount
 *             properties:
 *               userId:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *               totalAmount:
 *                 type: number
 *               status:
 *                 type: string
 *               shippingAddress:
 *                 type: object
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const { userId, items, totalAmount, status, shippingAddress } = req.body;
    
    // Basic validation
    if (!userId || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, items (array), totalAmount' 
      });
    }

    // Verify user exists (optional - comment out for local testing without user service)
    // const user = await verifyUser(userId);
    // if (!user) {
    //   return res.status(400).json({ error: 'User not found' });
    // }

    const newOrder = Order.create({ 
      userId, 
      items, 
      totalAmount, 
      status, 
      shippingAddress 
    });
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('POST /api/orders error:', error);
    res.status(500).json({ error: 'Failed to create order', message: error.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update an order
 *     tags: [Orders]
 *     description: Update an existing order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *               totalAmount:
 *                 type: number
 *               status:
 *                 type: string
 *               shippingAddress:
 *                 type: object
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = Order.update(req.params.id, req.body);
    res.json(updatedOrder);
  } catch (error) {
    console.error(`PUT /api/orders/${req.params.id} error:`, error);
    res.status(500).json({ error: 'Failed to update order', message: error.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     description: Delete an order from the system
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    Order.delete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error(`DELETE /api/orders/${req.params.id} error:`, error);
    res.status(500).json({ error: 'Failed to delete order', message: error.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     description: Update only the status of an order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
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
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = Order.updateStatus(req.params.id, status);
    res.json(updatedOrder);
  } catch (error) {
    console.error(`PATCH /api/orders/${req.params.id}/status error:`, error);
    res.status(500).json({ error: 'Failed to update order status', message: error.message });
  }
});

module.exports = router;

