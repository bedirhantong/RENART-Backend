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
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'User Operations',
        description: 'User profile and public operations'
      },
      {
        name: 'Public Products',
        description: 'Public product browsing'
      },
      {
        name: 'Favorites',
        description: 'User favorites management'
      },
      {
        name: 'Vendor Profile',
        description: 'Vendor profile management'
      },
      {
        name: 'Vendor Products',
        description: 'Vendor product management'
      }
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
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
      '/api/v1/public/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          description: 'Create a new user account',
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
      '/api/v1/public/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          description: 'Authenticate user and return JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              user: { $ref: '#/components/schemas/User' },
                              token: { type: 'string' },
                              refreshToken: { type: 'string' },
                              expiresAt: { type: 'number' }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '401': {
              description: 'Invalid credentials'
            }
          }
        }
      },
      '/api/v1/public/user/profile': {
        get: {
          tags: ['User Operations'],
          summary: 'Get user profile',
          description: 'Get current user profile information',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Profile retrieved successfully'
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        },
        put: {
          tags: ['User Operations'],
          summary: 'Update user profile',
          description: 'Update user profile information',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Profile updated successfully'
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        }
      },
      '/api/v1/public/vendors/{vendorId}/profile': {
        get: {
          tags: ['User Operations'],
          summary: 'Get vendor profile',
          description: 'Get vendor profile information',
          parameters: [
            {
              name: 'vendorId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            '200': {
              description: 'Vendor profile retrieved successfully'
            },
            '404': {
              description: 'Vendor not found'
            }
          }
        }
      },
      '/api/v1/public/vendors/{vendorId}/products': {
        get: {
          tags: ['User Operations'],
          summary: 'Get vendor products',
          description: 'Get products belonging to a specific vendor',
          parameters: [
            {
              name: 'vendorId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 }
            }
          ],
          responses: {
            '200': {
              description: 'Vendor products retrieved successfully'
            },
            '404': {
              description: 'Vendor not found'
            }
          }
        }
      },
      '/api/v1/public/products': {
        get: {
          tags: ['Public Products'],
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
            },
            {
              name: 'minPrice',
              in: 'query',
              schema: { type: 'number' }
            },
            {
              name: 'maxPrice',
              in: 'query',
              schema: { type: 'number' }
            },
            {
              name: 'sortBy',
              in: 'query',
              schema: { type: 'string', enum: ['name', 'price', 'weight', 'popularity'] }
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
      '/api/v1/public/products/{id}': {
        get: {
          tags: ['Public Products'],
          summary: 'Get product by ID',
          description: 'Get detailed information about a specific product',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            '200': {
              description: 'Product retrieved successfully'
            },
            '404': {
              description: 'Product not found'
            }
          }
        }
      },
      '/api/v1/public/favorites': {
        get: {
          tags: ['Favorites'],
          summary: 'Get user favorites',
          description: 'Get current user\'s favorite products',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Favorites retrieved successfully'
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        },
        post: {
          tags: ['Favorites'],
          summary: 'Add product to favorites',
          description: 'Add a product to user\'s favorites',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['productId'],
                  properties: {
                    productId: { type: 'string', format: 'uuid' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Product added to favorites'
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        }
      },
      '/api/v1/vendor/profile': {
        get: {
          tags: ['Vendor Profile'],
          summary: 'Get vendor profile',
          description: 'Get vendor profile and store information',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Vendor profile retrieved successfully'
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        },
        put: {
          tags: ['Vendor Profile'],
          summary: 'Update vendor profile',
          description: 'Update vendor profile and store information',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    logoUrl: { type: 'string', format: 'uri' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Vendor profile updated successfully'
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        }
      },
      '/api/v1/vendor/products': {
        get: {
          tags: ['Vendor Products'],
          summary: 'Get vendor products',
          description: 'Get vendor\'s own products',
          security: [{ bearerAuth: [] }],
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
            }
          ],
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
          tags: ['Vendor Products'],
          summary: 'Create a new product',
          description: 'Create a new product for the vendor',
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
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        }
      },
      '/api/v1/vendor/products/{id}': {
        get: {
          tags: ['Vendor Products'],
          summary: 'Get vendor product by ID',
          description: 'Get specific product belonging to vendor',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            '200': {
              description: 'Product retrieved successfully'
            },
            '404': {
              description: 'Product not found'
            }
          }
        },
        put: {
          tags: ['Vendor Products'],
          summary: 'Update vendor product',
          description: 'Update product information',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    weight: { type: 'number' },
                    popularityScore: { type: 'number', minimum: 0, maximum: 10 },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Product updated successfully'
            },
            '404': {
              description: 'Product not found'
            }
          }
        },
        delete: {
          tags: ['Vendor Products'],
          summary: 'Delete vendor product',
          description: 'Soft delete (deactivate) vendor product',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            '200': {
              description: 'Product deleted successfully'
            },
            '404': {
              description: 'Product not found'
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
