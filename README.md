# RENART Backend API

Professional Node.js + Supabase backend for RENART Jewelry Store.

## Features

- **Public Web App API**: Product listing, filtering, favorites management
- **Vendor Panel API**: Product and store management for RENART vendors
- **Real-time Gold Pricing**: Dynamic price calculation based on live gold prices
- **Authentication**: Supabase Auth integration
- **File Storage**: Supabase Storage for product images
- **Rate Limiting**: API protection with express-rate-limit
- **Comprehensive Documentation**: Swagger API documentation

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Validation**: Zod
- **Documentation**: Swagger
- **Logging**: Winston

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- NPM or Yarn
- Supabase Account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your Supabase credentials.

4. Start the development server:
   ```bash
   npm run dev
   ```

### API Documentation

Once the server is running, visit:
- API Documentation: `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/api/health`

## API Endpoints

### Public API (`/api/v1/public`)
- `GET /products` - List all active products
- `GET /products/:id` - Get product details
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /favorites` - Get user favorites (auth required)
- `POST /favorites` - Add to favorites (auth required)
- `DELETE /favorites/:id` - Remove from favorites (auth required)

### Vendor API (`/api/v1/vendor`)
- `GET /products` - List vendor products (auth required)
- `POST /products` - Create new product (auth required)
- `PUT /products/:id` - Update product (auth required)
- `DELETE /products/:id` - Soft delete product (auth required)
- `GET /store` - Get store information (auth required)
- `PUT /store` - Update store information (auth required)

## Database Schema

### Tables
- `vendors` - Vendor information
- `products` - Product catalog
- `product_images` - Product images with color variants
- `favorites` - User favorites

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment | No (default: development) |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `GOLD_PRICE_API_URL` | Gold price API endpoint | Yes |

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## License

MIT License
