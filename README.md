# Pri Fashion Management System

A fashion garment management system with Django backend and React frontend.

## Setup Instructions

### Prerequisites
- Python 3.13.3
- Node.js and npm
- MySQL

### Backend Setup

1. Create a virtual environment:
```
python -m venv new_env
```

2. Activate the virtual environment:
- Windows: `new_env\Scripts\activate.bat`
- Linux/Mac: `source new_env/bin/activate`

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Run the Django server:
```
cd backend
python manage.py runserver
```

Or use the provided batch file:
```
run_project.bat
```

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
- `requirements.txt`: Python dependencies
- `run_project.bat`: Batch file to run the Django server

## Notes

- Make sure your MySQL server is running
- The database settings are in `backend/backend/settings.py`
- Virtual environments should not be committed to version control
