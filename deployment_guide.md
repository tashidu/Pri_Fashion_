# Pri Fashion Deployment Guide

This guide provides step-by-step instructions for deploying the Pri Fashion project to free hosting services.

## Backend Deployment to PythonAnywhere

### 1. Create a PythonAnywhere Account

1. Go to [PythonAnywhere](https://www.pythonanywhere.com/) and sign up for a free account
2. After signing up, you'll have access to a dashboard

### 2. Set Up a MySQL Database

1. Go to the Databases tab in your PythonAnywhere dashboard
2. Create a new MySQL database (note the database name will be `yourusername$prifashion`)
3. Set a password for your database
4. Note your database credentials:
   - Host: `yourusername.mysql.pythonanywhere-services.com`
   - Username: `yourusername`
   - Password: The password you set
   - Database Name: `yourusername$prifashion`

### 3. Upload Your Project

1. Prepare your project for deployment:
   ```bash
   # Create a zip file of your project (excluding virtual environments and unnecessary files)
   # On Windows:
   powershell Compress-Archive -Path . -DestinationPath pri-fashion.zip -Force
   ```

2. In PythonAnywhere dashboard, go to the Files tab
3. Create a new directory: `pri-fashion`
4. Upload the zip file to this directory
5. Use the PythonAnywhere bash console to unzip the file:
   ```bash
   cd pri-fashion
   unzip pri-fashion.zip
   rm pri-fashion.zip
   ```

### 4. Set Up Virtual Environment and Install Dependencies

1. In the PythonAnywhere bash console:
   ```bash
   # Create a virtual environment
   python -m venv venv
   
   # Activate the virtual environment
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Install additional packages needed for production
   pip install gunicorn
   ```

### 5. Configure Environment Variables

1. Create a `.env` file in your project root with your production settings:
   ```bash
   # In PythonAnywhere bash console
   cp .env.production .env
   nano .env
   ```
   
2. Update the values in the `.env` file with your actual PythonAnywhere database credentials and a new secret key

### 6. Configure the Web App

1. Go to the Web tab in your PythonAnywhere dashboard
2. Click "Add a new web app"
3. Choose "Manual configuration" (not "Django")
4. Select Python version (3.10 or the closest to your development version)
5. Configure the virtual environment path: `/home/yourusername/pri-fashion/venv`
6. Set the WSGI configuration file:
   - Click on the WSGI configuration file link
   - Replace the content with the content from `backend/backend/wsgi_pythonanywhere.py`
   - Update all instances of `yourusername` with your actual PythonAnywhere username
   - Save the file

### 7. Configure Static Files

1. In the Web tab, scroll down to "Static files"
2. Add the following mappings:
   - URL: `/static/` → Directory: `/home/yourusername/pri-fashion/backend/static`
   - URL: `/media/` → Directory: `/home/yourusername/pri-fashion/backend/media`

### 8. Run Database Migrations

1. In the PythonAnywhere bash console:
   ```bash
   cd pri-fashion/backend
   python manage.py migrate --settings=backend.settings_prod
   python manage.py collectstatic --settings=backend.settings_prod
   ```

### 9. Create a Superuser (Optional)

1. In the PythonAnywhere bash console:
   ```bash
   python manage.py createsuperuser --settings=backend.settings_prod
   ```

### 10. Reload the Web App

1. Go back to the Web tab and click the "Reload" button for your web app

## Frontend Deployment to Vercel

### 1. Prepare Your React App for Production

1. Update the API endpoints in your React app to point to your PythonAnywhere backend:
   - Open `frontend/src/api/config.js` or similar file
   - Update the base URL to `https://yourusername.pythonanywhere.com/api`

2. Build your React app:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

### 2. Deploy to Vercel

1. Sign up for a free account at [Vercel](https://vercel.com/)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. Deploy your frontend:
   ```bash
   cd frontend
   vercel login
   vercel
   ```

4. Follow the prompts to complete the deployment
5. After deployment, Vercel will provide you with a URL for your frontend

### 3. Update CORS Settings

1. Update the `CORS_ALLOWED_ORIGINS` in `backend/backend/settings_prod.py` with your Vercel domain
2. Reload your PythonAnywhere web app

## Alternative: Deploy Frontend to Netlify

1. Sign up for a free account at [Netlify](https://www.netlify.com/)
2. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

3. Deploy your frontend:
   ```bash
   cd frontend
   netlify login
   netlify deploy
   ```

4. Follow the prompts to complete the deployment
5. After deployment, update the CORS settings in your backend with the Netlify domain

## Testing Your Deployment

1. Visit your frontend URL (from Vercel or Netlify)
2. Try to log in and verify that the application works correctly
3. Test all major features to ensure they work in the production environment

## Troubleshooting

- **CORS Issues**: Ensure that your backend's CORS settings include your frontend domain
- **Database Connection Issues**: Verify your database credentials in the `.env` file
- **Static Files Not Loading**: Check the static files configuration in PythonAnywhere
- **API Endpoints Not Working**: Ensure you've updated all API endpoints in your frontend code

## Maintenance

- PythonAnywhere free accounts require you to log in at least once every 3 months to keep your account active
- Regularly check for security updates and apply them to your application
