const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Route & Group Service API',
      version: '1.0.0',
      description: 'RESTful API for Route Proposal and Group Formation Management - Columbia Point2Point Shuttle',
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
        url: 'http://34.123.236.40',
        description: 'Production Server (GCP VM)'
      }
    ],
    tags: [
      {
        name: 'Routes',
        description: 'Route proposal and management endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ],
    components: {
      schemas: {
        Route: {
          type: 'object',
          required: ['from', 'to', 'schedule', 'semester', 'createdBy'],
          properties: {
            id: {
              type: 'integer',
              description: 'Route ID',
              example: 1
            },
            from: {
              type: 'string',
              description: 'Starting location',
              example: 'Columbia University'
            },
            to: {
              type: 'string',
              description: 'Destination location',
              example: 'Flushing, Queens'
            },
            status: {
              type: 'string',
              enum: ['proposed', 'active', 'completed', 'cancelled'],
              description: 'Route status',
              example: 'proposed'
            },
            schedule: {
              type: 'object',
              properties: {
                days: {
                  type: 'array',
                  items: { 'type': 'string' },
                  example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                },
                morningTime: {
                  type: 'string',
                  format: 'time',
                  example: '08:00:00'
                },
                eveningTime: {
                  type: 'string',
                  format: 'time',
                  example: '18:30:00'
                }
              }
            },
            semester: {
              type: 'string',
              description: 'Academic semester',
              example: 'Fall 2025'
            },
            currentMembers: {
              type: 'integer',
              description: 'Current number of members',
              example: 8
            },
            requiredMembers: {
              type: 'integer',
              description: 'Required members to activate route',
              example: 15
            },
            estimatedCost: {
              type: 'number',
              format: 'float',
              description: 'Estimated cost per semester in USD',
              example: 120.00
            },
            description: {
              type: 'string',
              description: 'Route description',
              example: 'Daily shuttle service between Columbia and Flushing'
            },
            createdBy: {
              type: 'integer',
              description: 'User ID of route creator',
              example: 1
            },
            version: {
              type: 'integer',
              description: 'Version number for ETag support',
              example: 1
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Route creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Route last update timestamp'
            },
            links: {
              type: 'object',
              description: 'HATEOAS links',
              properties: {
                self: {
                  type: 'string',
                  example: '/routes/1'
                },
                members: {
                  type: 'string',
                  example: '/routes/1/members'
                },
                trips: {
                  type: 'string',
                  example: '/routes/1/trips'
                },
                subscriptions: {
                  type: 'string',
                  example: '/subscriptions?route_id=1'
                }
              }
            }
          }
        },
        RouteMember: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
              example: 1
            },
            email: {
              type: 'string',
              description: 'User email',
              example: 'john.doe@columbia.edu'
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Doe'
            },
            homeArea: {
              type: 'string',
              description: 'User home area',
              example: 'Flushing, Queens'
            },
            joinedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when user joined the route'
            },
            memberStatus: {
              type: 'string',
              enum: ['confirmed', 'pending', 'cancelled'],
              description: 'Member status',
              example: 'confirmed'
            }
          }
        },
        PaginatedRoutes: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            routes: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Route'
              }
            },
            pagination: {
              type: 'object',
              properties: {
                totalCount: {
                  type: 'integer',
                  example: 50
                },
                page: {
                  type: 'integer',
                  example: 1
                },
                pageSize: {
                  type: 'integer',
                  example: 20
                },
                totalPages: {
                  type: 'integer',
                  example: 3
                },
                hasNext: {
                  type: 'boolean',
                  example: true
                },
                hasPrev: {
                  type: 'boolean',
                  example: false
                },
                links: {
                  type: 'object',
                  properties: {
                    self: {
                      type: 'string',
                      example: '/routes?page=1&page_size=20'
                    },
                    next: {
                      type: 'string',
                      example: '/routes?page=2&page_size=20'
                    },
                    prev: {
                      type: 'string',
                      nullable: true,
                      example: null
                    }
                  }
                }
              }
            }
          }
        },
        SuccessRouteResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            route: {
              $ref: '#/components/schemas/Route'
            }
          }
        },
        SuccessMessageResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            }
          }
        },
        SuccessJoinResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Successfully joined route'
            },
            route: {
              $ref: '#/components/schemas/Route'
            }
          }
        },
        SuccessMembersResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            routeId: {
              type: 'integer',
              example: 1
            },
            totalMembers: {
              type: 'integer',
              example: 5
            },
            members: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/RouteMember'
              }
            }
          }
        },
        ActivationTaskResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            taskId: {
              type: 'string',
              description: 'Unique task identifier',
              example: 'activation-1-1732388400000'
            },
            status: {
              type: 'string',
              enum: ['pending'],
              description: 'Task status (always pending on creation)',
              example: 'pending'
            },
            statusUrl: {
              type: 'string',
              description: 'URL to poll for status updates',
              example: '/api/route-activations/activation-1-1732388400000'
            },
            message: {
              type: 'string',
              example: 'Route activation has been queued for processing'
            }
          }
        },
        ActivationTaskStatus: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            taskId: {
              type: 'string',
              description: 'Unique task identifier',
              example: 'activation-1-1732388400000'
            },
            status: {
              type: 'string',
              enum: ['pending', 'success', 'failed'],
              description: 'Task status',
              example: 'pending'
            },
            routeId: {
              type: 'integer',
              description: 'Route ID being activated',
              example: 1
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task start timestamp'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task completion timestamp',
              nullable: true
            },
            details: {
              type: 'string',
              description: 'Task details or error message',
              example: 'Activation checks are running.'
            },
            route: {
              $ref: '#/components/schemas/Route',
              description: 'Updated route object (when status is success)',
              nullable: true
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
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
      },
      parameters: {
        ETagHeader: {
          name: 'If-Match',
          in: 'header',
          description: 'ETag value for conditional updates',
          required: false,
          schema: {
            type: 'string'
          }
        }
      },
      responses: {
        PreconditionFailed: {
          description: 'Precondition Failed - ETag mismatch',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'string',
                    example: 'Precondition Failed'
                  },
                  message: {
                    type: 'string',
                    example: 'The route has been modified by another request. Please fetch the latest version and try again.'
                  }
                }
              }
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