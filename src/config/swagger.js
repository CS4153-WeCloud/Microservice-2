const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order Service API',
      version: '1.0.0',
      description: 'RESTful API for Order Management',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      },
      {
        url: 'http://<your-gcp-vm-ip>:3002',
        description: 'Production server (GCP)'
      }
    ],
    tags: [
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ],
    components: {
      schemas: {
        Order: {
          type: 'object',
          required: ['userId', 'items', 'totalAmount'],
          properties: {
            id: {
              type: 'string',
              description: 'Order ID (UUID)',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            userId: {
              type: 'integer',
              description: 'User ID who placed the order',
              example: 1
            },
            items: {
              type: 'array',
              description: 'List of order items',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'string',
                    example: 'PROD-123'
                  },
                  productName: {
                    type: 'string',
                    example: 'Sample Product'
                  },
                  quantity: {
                    type: 'integer',
                    example: 2
                  },
                  price: {
                    type: 'number',
                    format: 'float',
                    example: 29.99
                  }
                }
              }
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              description: 'Total order amount',
              example: 59.98
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              description: 'Order status',
              example: 'pending'
            },
            shippingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string', example: '123 Main St' },
                city: { type: 'string', example: 'San Francisco' },
                state: { type: 'string', example: 'CA' },
                zipCode: { type: 'string', example: '94102' },
                country: { type: 'string', example: 'USA' }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order last update timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message'
            },
            message: {
              type: 'string',
              example: 'Detailed error description'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/server.js']
};

const specs = swaggerJsdoc(options);

module.exports = { specs };

