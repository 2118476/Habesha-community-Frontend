# Habesha Community Frontend

React frontend for the Habesha Community platform.

## Environment Variables

### Required for Netlify Production:
- `REACT_APP_API_URL` = `https://habesha-community-backend.onrender.com`
- `REACT_APP_FEED_BACKEND` = `false` (optional)

### Optional Netlify Build Settings:
- If builds fail on warnings, set `CI=false` in Netlify environment variables

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
# Copy example env file
cp .env.example .env.development

# Edit .env.development to use local backend
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FEED_BACKEND=false
```

3. Start development server:
```bash
npm start
```

## Deployment

### Netlify
- Build command: `npm run build`
- Publish directory: `build`
- Environment variables: Set `REACT_APP_API_URL` to production backend URL

### SPA Routing
The `public/_redirects` file ensures all routes redirect to `index.html` for proper SPA routing on Netlify.

## Backend Integration
All API calls use the centralized axios instance (`src/api/axiosInstance.js`) which reads from `REACT_APP_API_URL`. No hardcoded backend URLs should exist in the codebase.