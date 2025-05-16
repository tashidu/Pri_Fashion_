# Pri Fashion Management System

A fashion garment management system with Django backend and React frontend.

## Quick Setup

For a quick setup, run the setup script:

```
setup.bat
```

This script will:
1. Check if Python is installed
2. Ask if you're setting up on a local machine or VM
3. Create a virtual environment
4. Install dependencies
5. Set up the appropriate environment file

## Manual Setup Instructions

### Prerequisites
- Python 3.13.3
- Node.js and npm
- MySQL

### Environment Setup

1. Choose the appropriate environment file:
   - For local machine: Copy `.env.local` to `.env`
   - For VM: Copy `.env.vm` to `.env`

### Backend Setup

1. Create a virtual environment:
```
python -m venv new_env
```

2. Install dependencies:
```
new_env\Scripts\pip.exe install -r requirements.txt
```

3. Run the Django server:
   - For local machine: `run_local.bat`
   - For VM: `run_vm.bat`

### Frontend Setup

1. Navigate to the frontend directory:
```
cd frontend
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm start
```

## Project Structure

- `backend/`: Django backend
- `frontend/`: React frontend
- `media/`: Media files
- `.env.local`: Environment variables for local machine
- `.env.vm`: Environment variables for VM
- `.env.template`: Template for environment variables
- `requirements.txt`: Python dependencies
- `run_local.bat`: Batch file to run the Django server on local machine
- `run_vm.bat`: Batch file to run the Django server on VM
- `setup.bat`: Setup script for new environments

## Environment Variables

The project uses environment variables for configuration. These are stored in `.env` files:

- `DATABASE_NAME`: Name of the MySQL database
- `DATABASE_USER`: MySQL username
- `DATABASE_PASSWORD`: MySQL password
- `DATABASE_HOST`: MySQL host
- `DATABASE_PORT`: MySQL port
- `PYTHON_PATH`: Path to Python executable
- `MEDIA_ROOT`: Path to media files
- `DEBUG`: Whether to run in debug mode
- `SECRET_KEY`: Django secret key

## Notes

- Make sure your MySQL server is running
- Virtual environments should not be committed to version control
- If you switch between environments, use the appropriate batch file
