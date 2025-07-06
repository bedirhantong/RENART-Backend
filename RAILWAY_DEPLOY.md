# Railway Deployment Guide

## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## Manual Deployment

1. Fork this repository
2. Connect your Railway account to GitHub
3. Create a new project from GitHub repo
4. Set the required environment variables (see below)
5. Deploy!

## Required Environment Variables

Copy from `.env.example` and set these in Railway:

### Essential Variables
```
NODE_ENV=production
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-super-secret-jwt-key
```

### Optional Variables
```
CORS_ORIGIN=https://your-frontend-domain.com
GOLD_PRICE_API_URL=https://api.goldapi.io/v1/price
ENABLE_GOLD_PRICE_UPDATES=true
```

## Railway Configuration

The app includes:
- `railway.json` for Railway-specific settings
- Health check endpoint at `/api/health`
- Graceful shutdown handling
- Error resilience for external services

## Notes

- The app will work without gold price APIs (uses fallback pricing)
- Health check ensures the app is responding correctly
- Auto-restart is configured for failures
- All external API errors are handled gracefully

## Troubleshooting

If deployment fails:
1. Check environment variables are set correctly
2. Verify Supabase credentials
3. Check the Railway logs for specific errors
4. Ensure your domain is added to CORS_ORIGIN if needed
