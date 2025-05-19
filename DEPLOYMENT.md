# Pri Fashion Deployment Guide

This document provides a quick reference for deploying the Pri Fashion project to free hosting services.

## Free Hosting Options

### Backend (Django + MySQL)
- **PythonAnywhere** - Free tier includes:
  - 1 Python web app
  - 512MB MySQL database
  - Custom domain support
  - HTTPS included

### Frontend (React)
- **Vercel** - Free tier includes:
  - Unlimited static sites
  - Custom domain support
  - HTTPS included
  - Continuous deployment from GitHub

## Quick Deployment Steps

### 1. Prepare for Deployment
Run the preparation script:
```
prepare_for_deployment.bat
```

This script will:
- Generate a secure secret key
- Update configuration files with your PythonAnywhere username
- Build the React frontend
- Create a deployment package (pri-fashion.zip)

### 2. Deploy Backend to PythonAnywhere
1. Create a free account at [PythonAnywhere](https://www.pythonanywhere.com/)
2. Create a MySQL database in the Databases tab
3. Upload and extract the deployment package
4. Set up a virtual environment and install dependencies
5. Configure the web app in the Web tab
6. Run migrations and collect static files

### 3. Deploy Frontend to Vercel
1. Create a free account at [Vercel](https://vercel.com/)
2. Install the Vercel CLI: `npm install -g vercel`
3. Deploy the frontend: `cd frontend && vercel`

### 4. Verify Deployment
Run the verification script:
```
python verify_deployment.py yourusername
```

## Detailed Instructions

For detailed step-by-step instructions, refer to the [deployment_guide.md](deployment_guide.md) file.

## Important Notes

- The free tier of PythonAnywhere requires you to log in at least once every 3 months to keep your account active
- The MySQL database on PythonAnywhere free tier is limited to 512MB
- Vercel's free tier has generous limits for personal projects

## Troubleshooting

If you encounter issues during deployment, check:
1. Database connection settings in `.env.production`
2. CORS settings in `settings_prod.py`
3. API base URL in the frontend configuration
4. PythonAnywhere error logs in the Web tab

For more detailed troubleshooting, refer to the [deployment_guide.md](deployment_guide.md) file.
