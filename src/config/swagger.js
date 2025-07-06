const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RENART Backend API',
      version: '1.0.0',
      description: 'Professional Node.js + Supabase backend for RENART Jewelry Store',
      contact: {
        name: 'RENART Team',
        email: 'api@renart.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.renart.com' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Product ID'
            },
            vendor_id: {
              type: 'string',
              format: 'uuid',
              description: 'Vendor ID'
            },
            name: {
              type: 'string',
              description: 'Product name'
            },
            weight: {
              type: 'number',
              description: 'Product weight in grams'
            },
            popularity_score: {
              type: 'number',
              minimum: 0,
              maximum: 10,
              description: 'Product popularity score (0-10)'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the product is active'
            },
            calculatedPrice: {
              type: 'number',
              description: 'Dynamically calculated price based on gold price'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Vendor: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              description: 'Vendor name'
            },
            description: {
              type: 'string',
              description: 'Vendor description'
            },
            logo_url: {
              type: 'string',
              format: 'uri',
              description: 'Logo URL'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            is_active: {
              type: 'boolean'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'null'
            }
          }
        }
      }
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          description: 'Check the health status of the API and its services',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ApiResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/public/products': {
        get: {
          summary: 'Get all active products',
          description: 'Retrieve all active products with filtering and pagination',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 }
            },
            {
              name: 'color',
              in: 'query',
              schema: { type: 'string', enum: ['yellow', 'white', 'rose'] }
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Products retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ApiResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/public/auth/register': {
        post: {
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'firstName', 'lastName'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'User registered successfully'
            },
            '400': {
              description: 'Validation error'
            }
          }
        }
      },
      '/api/v1/vendor/products': {
        get: {
          summary: 'Get vendor products',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Vendor products retrieved successfully'
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        },
        post: {
          summary: 'Create a new product',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'weight', 'popularityScore', 'colors'],
                  properties: {
                    name: { type: 'string' },
                    weight: { type: 'number' },
                    popularityScore: { type: 'number', minimum: 0, maximum: 10 },
                    colors: {
                      type: 'array',
                      items: { type: 'string', enum: ['yellow', 'white', 'rose'] }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Product created successfully'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};
