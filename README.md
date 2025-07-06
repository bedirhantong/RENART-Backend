# RENART Backend API Documentation

A professional Node.js + Supabase backend for RENART Jewelry Store with separate User and Vendor web applications.

## 🎯 Overview

This backend serves two distinct frontend applications:
- **Public Web App**: Customer-facing jewelry store for browsing products and managing favorites
- **Vendor Panel**: Vendor management interface for product and store management

The API provides JWT-based authentication, dynamic gold pricing, product management, and comprehensive user/vendor operations.

## 🚀 Quick Start

### Server Information
- **Base URL**: `http://localhost:3002`
- **API Documentation**: `http://localhost:3002/api-docs`
- **Health Check**: `http://localhost:3002/api/health`

### Installation

```bash
npm install
PORT=3002 npm start
```

## 🔐 Authentication

### How Authentication Works

1. **Registration/Login**: Users receive a JWT token
2. **Token Usage**: Include in requests as `Authorization: Bearer <token>`
3. **Token Expiry**: Tokens expire in 7 days
4. **Vendor Access**: Same authentication, but vendor routes check if user is a registered vendor

---

## 📱 PUBLIC WEB APP ENDPOINTS

*For customer-facing jewelry store application*

### 🔑 Authentication

#### Register New User
```http
POST /api/v1/public/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. You can now login.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Error Responses:**
- `409`: Email already exists
- `400`: Invalid email or password validation failed

---

#### Login User
```http
POST /api/v1/public/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresAt": 1640995200
  }
}
```

**Error Responses:**
- `401`: Invalid credentials
- `404`: Account not found

---

#### Logout User
```http
POST /api/v1/public/auth/logout
```
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

---

### 👤 User Profile Management

#### Get User Profile
```http
GET /api/v1/public/user/profile
```
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

#### Update User Profile
```http
PUT /api/v1/public/user/profile
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

### 🛍️ Product Browsing

#### Get All Products
```http
GET /api/v1/public/products
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search product names
- `color` (string): Filter by color (yellow, white, rose)
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `minWeight` (number): Minimum weight filter
- `maxWeight` (number): Maximum weight filter
- `minPopularity` (number): Minimum popularity (0-10)
- `maxPopularity` (number): Maximum popularity (0-10)
- `sortBy` (string): Sort field (name, price, weight, popularity)
- `sortOrder` (string): Sort direction (asc, desc)

**Example Request:**
```http
GET /api/v1/public/products?page=1&limit=10&color=yellow&minPrice=100&maxPrice=500&sortBy=price&sortOrder=asc
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "uuid",
        "vendor_id": "uuid",
        "name": "Golden Ring",
        "popularity_score": 8.5,
        "weight": 5.2,
        "is_active": true,
        "calculatedPrice": 245.50,
        "created_at": "2024-01-01T00:00:00Z",
        "vendors": {
          "id": "uuid",
          "name": "RENART Jewelry",
          "logo_url": "https://..."
        },
        "product_images": [
          {
            "id": "uuid",
            "color": "yellow",
            "image_url": "https://..."
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    },
    "goldPrice": 2000.50,
    "lastPriceUpdate": "2024-01-01T12:00:00Z"
  }
}
```

---

#### Get Single Product
```http
GET /api/v1/public/products/{id}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": {
      "id": "uuid",
      "vendor_id": "uuid",
      "name": "Golden Ring",
      "popularity_score": 8.5,
      "weight": 5.2,
      "is_active": true,
      "calculatedPrice": 245.50,
      "vendors": {
        "id": "uuid",
        "name": "RENART Jewelry",
        "description": "Premium jewelry maker",
        "logo_url": "https://..."
      },
      "product_images": [
        {
          "id": "uuid",
          "color": "yellow",
          "image_url": "https://..."
        }
      ]
    },
    "goldPrice": 2000.50,
    "lastPriceUpdate": "2024-01-01T12:00:00Z"
  }
}
```

**Error Responses:**
- `404`: Product not found

---

### 🏪 Vendor Information

#### Get Vendor Profile
```http
GET /api/v1/public/vendors/{vendorId}/profile
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Vendor profile retrieved successfully",
  "data": {
    "vendor": {
      "id": "uuid",
      "name": "RENART Jewelry",
      "description": "Premium handcrafted jewelry since 1985",
      "logoUrl": "https://...",
      "email": "contact@renart.com",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

#### Get Vendor Products
```http
GET /api/v1/public/vendors/{vendorId}/products
```

**Query Parameters:** Same as Get All Products

**Success Response (200):**
```json
{
  "success": true,
  "message": "Vendor products retrieved successfully",
  "data": {
    "products": [...],
    "vendor": {
      "id": "uuid",
      "name": "RENART Jewelry"
    },
    "pagination": {...}
  }
}
```

---

### ❤️ Favorites Management

#### Get User Favorites
```http
GET /api/v1/public/favorites
```
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Favorites retrieved successfully",
  "data": {
    "favorites": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "product_id": "uuid",
        "created_at": "2024-01-01T00:00:00Z",
        "products": {
          "id": "uuid",
          "name": "Golden Ring",
          "calculatedPrice": 245.50,
          "vendors": {
            "name": "RENART Jewelry"
          },
          "product_images": [...]
        }
      }
    ]
  }
}
```

---

#### Add Product to Favorites
```http
POST /api/v1/public/favorites
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "productId": "uuid"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Product added to favorites",
  "data": {
    "favorite": {
      "id": "uuid",
      "user_id": "uuid",
      "product_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses:**
- `409`: Product already in favorites
- `404`: Product not found

---

#### Remove from Favorites
```http
DELETE /api/v1/public/favorites/{favoriteId}
```
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product removed from favorites",
  "data": null
}
```

---

#### Check if Product is Favorite
```http
GET /api/v1/public/favorites/check/{productId}
```
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Favorite status retrieved",
  "data": {
    "isFavorite": true,
    "favoriteId": "uuid"
  }
}
```

---

## 🏢 VENDOR PANEL ENDPOINTS

*For vendor management application*

**Authentication:** All vendor endpoints require `Authorization: Bearer <token>` and the user must be a registered vendor.

### 🏪 Vendor Profile Management

#### Get Vendor Profile
```http
GET /api/v1/vendor/profile
```
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Store information retrieved successfully",
  "data": {
    "store": {
      "id": "uuid",
      "name": "RENART Jewelry",
      "description": "Premium handcrafted jewelry",
      "logoUrl": "https://...",
      "email": "vendor@renart.com",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "statistics": {
      "totalProducts": 25,
      "activeProducts": 23,
      "inactiveProducts": 2
    }
  }
}
```

---

#### Update Vendor Profile
```http
PUT /api/v1/vendor/profile
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "RENART Premium Jewelry",
  "description": "Luxury handcrafted jewelry since 1985",
  "logoUrl": "https://new-logo-url.com/logo.png"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Store information updated successfully",
  "data": {
    "store": {
      "id": "uuid",
      "name": "RENART Premium Jewelry",
      "description": "Luxury handcrafted jewelry since 1985",
      "logoUrl": "https://new-logo-url.com/logo.png",
      "email": "vendor@renart.com",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

---

#### Get Dashboard Statistics
```http
GET /api/v1/vendor/dashboard
```
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "statistics": {
      "products": {
        "total": 25,
        "active": 23,
        "inactive": 2,
        "recent": 3
      },
      "favorites": {
        "total": 47
      }
    },
    "topProducts": [
      {
        "id": "uuid",
        "name": "Golden Ring",
        "favoriteCount": 12
      }
    ]
  }
}
```

---

### 📦 Vendor Product Management

#### Get Vendor Products
```http
GET /api/v1/vendor/products
```
**Headers:** `Authorization: Bearer <token>`
**Query Parameters:** Same as public products endpoint

**Success Response (200):**
```json
{
  "success": true,
  "message": "Vendor products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "uuid",
        "vendor_id": "uuid",
        "name": "Golden Ring",
        "popularity_score": 8.5,
        "weight": 5.2,
        "is_active": true,
        "calculatedPrice": 245.50,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "product_images": [
          {
            "id": "uuid",
            "color": "yellow",
            "image_url": "https://..."
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

#### Get Single Vendor Product
```http
GET /api/v1/vendor/products/{id}
```
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": {
      "id": "uuid",
      "vendor_id": "uuid",
      "name": "Golden Ring",
      "popularity_score": 8.5,
      "weight": 5.2,
      "is_active": true,
      "calculatedPrice": 245.50,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "product_images": [
        {
          "id": "uuid",
          "color": "yellow",
          "image_url": "https://..."
        }
      ]
    }
  }
}
```

---

#### Create New Product
```http
POST /api/v1/vendor/products
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Diamond Necklace",
  "weight": 12.5,
  "popularityScore": 9.2,
  "colors": ["yellow", "white"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": "uuid",
      "vendor_id": "uuid",
      "name": "Diamond Necklace",
      "popularity_score": 9.2,
      "weight": 12.5,
      "is_active": true,
      "calculatedPrice": 512.75,
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    },
    "images": [
      {
        "id": "uuid",
        "color": "yellow",
        "image_url": null
      },
      {
        "id": "uuid",
        "color": "white",
        "image_url": null
      }
    ]
  }
}
```

**Error Responses:**
- `400`: Validation error (invalid weight, popularity score, etc.)

---

#### Update Product
```http
PUT /api/v1/vendor/products/{id}
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Premium Diamond Necklace",
  "weight": 13.0,
  "popularityScore": 9.5,
  "isActive": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      "id": "uuid",
      "vendor_id": "uuid",
      "name": "Premium Diamond Necklace",
      "popularity_score": 9.5,
      "weight": 13.0,
      "is_active": true,
      "calculatedPrice": 546.25,
      "updated_at": "2024-01-01T13:00:00Z"
    }
  }
}
```

---

#### Delete Product (Soft Delete)
```http
DELETE /api/v1/vendor/products/{id}
```
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": null
}
```

**Error Responses:**
- `404`: Product not found
- `403`: Product belongs to another vendor

---

## 🔧 System Endpoints

### Health Check
```http
GET /api/health
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00Z",
    "uptime": 3600,
    "environment": "development",
    "services": {
      "database": "connected",
      "goldPriceService": "active"
    },
    "goldPrice": {
      "current": 2000.50,
      "lastUpdate": "2024-01-01T11:50:00Z",
      "source": "metals-api"
    }
  }
}
```

---

## 💰 Dynamic Pricing System

### How Pricing Works

Product prices are calculated dynamically using:

```
Price = (popularityScore + 1) × weight × goldPrice
```

**Example:**
- Product weight: 5.2g
- Popularity score: 8.5
- Current gold price: $2000/oz
- **Calculated price**: (8.5 + 1) × 5.2 × 2000 = $98,800

### Gold Price Updates

- **Update frequency**: Every 10 minutes
- **Fallback**: If API fails, uses cached price
- **Sources**: metals-api.com, fixer.io

---

## ❌ Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate resource)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

### Authentication Errors

```json
{
  "success": false,
  "message": "Authorization header missing. Please include Authorization header with Bearer token.",
  "data": null,
  "hint": "Authentication required. Please login and include the token in Authorization header: Bearer <token>"
}
```

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 6 characters"
      }
    ]
  }
}
```

---

## 🔒 Security & Rate Limiting

### Rate Limits

- **General**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **Vendor endpoints**: 50 requests per 15 minutes

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### CORS Configuration

- **Allowed Origins**: Configurable via environment
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Authorization, Content-Type

---

## 🗄️ Database Schema

### Tables Overview

```sql
-- Users (managed by Supabase Auth)
auth.users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamp,
  created_at timestamp,
  updated_at timestamp,
  raw_user_meta_data jsonb
)

-- Vendors
vendors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  logo_url text,
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)

-- Products
products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid REFERENCES vendors(id),
  name text NOT NULL,
  popularity_score numeric(3,1) CHECK (popularity_score >= 0 AND popularity_score <= 10),
  weight numeric(10,2) NOT NULL CHECK (weight > 0),
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)

-- Product Images
product_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  color text CHECK (color IN ('yellow', 'white', 'rose')),
  image_url text
)

-- Favorites
favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, product_id)
)
```

### Row Level Security (RLS)

- **Vendors**: Can only access their own data
- **Products**: Vendors can only manage their own products
- **Favorites**: Users can only access their own favorites
- **Public**: Anyone can read active products and vendor profiles

---

## 🚀 Frontend Integration Guide

### Authentication Flow

1. **User Registration/Login**
   ```javascript
   // Register
   const response = await fetch('/api/v1/public/auth/register', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'user@example.com',
       password: 'password123',
       firstName: 'John',
       lastName: 'Doe'
     })
   })
   
   // Login
   const loginResponse = await fetch('/api/v1/public/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'user@example.com',
       password: 'password123'
     })
   })
   
   const { data } = await loginResponse.json()
   const token = data.token
   
   // Store token for future requests
   localStorage.setItem('token', token)
   ```

2. **Making Authenticated Requests**
   ```javascript
   const token = localStorage.getItem('token')
   
   const response = await fetch('/api/v1/public/user/profile', {
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     }
   })
   ```

### Error Handling

```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options.headers
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      throw new Error(data.message || 'Request failed')
    }
    
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}
```

### Product Loading with Pagination

```javascript
// Load products with filters
async function loadProducts(filters = {}) {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 10,
    ...(filters.search && { search: filters.search }),
    ...(filters.color && { color: filters.color }),
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    sortBy: filters.sortBy || 'name',
    sortOrder: filters.sortOrder || 'asc'
  })
  
  const response = await apiRequest(`/api/v1/public/products?${params}`)
  return response.data
}

// Example usage
const productsData = await loadProducts({
  page: 1,
  limit: 20,
  color: 'yellow',
  minPrice: 100,
  maxPrice: 1000,
  sortBy: 'price',
  sortOrder: 'asc'
})

console.log('Products:', productsData.products)
console.log('Pagination:', productsData.pagination)
console.log('Current gold price:', productsData.goldPrice)
```

### Favorites Management

```javascript
// Add to favorites
async function addToFavorites(productId) {
  const response = await apiRequest('/api/v1/public/favorites', {
    method: 'POST',
    body: JSON.stringify({ productId })
  })
  return response.data
}

// Remove from favorites
async function removeFromFavorites(favoriteId) {
  await apiRequest(`/api/v1/public/favorites/${favoriteId}`, {
    method: 'DELETE'
  })
}

// Check if product is favorite
async function checkFavorite(productId) {
  const response = await apiRequest(`/api/v1/public/favorites/check/${productId}`)
  return response.data.isFavorite
}
```

### Vendor Product Management

```javascript
// Create new product (vendor only)
async function createProduct(productData) {
  const response = await apiRequest('/api/v1/vendor/products', {
    method: 'POST',
    body: JSON.stringify({
      name: productData.name,
      weight: productData.weight,
      popularityScore: productData.popularityScore,
      colors: productData.colors
    })
  })
  return response.data
}

// Update product
async function updateProduct(productId, updates) {
  const response = await apiRequest(`/api/v1/vendor/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return response.data
}

// Delete product
async function deleteProduct(productId) {
  await apiRequest(`/api/v1/vendor/products/${productId}`, {
    method: 'DELETE'
  })
}
```

---

## 🛠️ Development Notes

### Environment Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Update .env with your Supabase credentials
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Start development server
PORT=3002 npm start
```

### Testing Endpoints

1. **Use Swagger UI**: Visit `http://localhost:3002/api-docs`
2. **Use curl examples above**
3. **Use Postman**: Import endpoints from Swagger

### Common Issues

1. **CORS Errors**: Update `CORS_ORIGIN` in .env
2. **Authentication Fails**: Check token format and expiry
3. **Rate Limiting**: Wait for rate limit reset or increase limits
4. **Database Errors**: Check Supabase connection and RLS policies

---

## 📞 Support

For technical support or questions about this API:

- **Documentation**: Available at `/api-docs`
- **Health Check**: Monitor at `/api/health`
- **Error Logs**: Check server console for detailed error information

---

*This documentation covers all endpoints and functionality needed to build both the Public Web App and Vendor Panel applications.*
