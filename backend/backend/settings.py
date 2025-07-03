import pymysql
pymysql.install_as_MySQLdb()

from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
# Priority: .env.local > .env
env_files = ['.env.local', '.env']
loaded_env = None

for env_file in env_files:
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), env_file)
    if os.path.exists(env_path):
        load_dotenv(env_path)
        loaded_env = env_file
        print(f"Loaded {env_file}")
        break

if loaded_env is None:
    print("No environment file found, using default settings")

BASE_DIR = Path(__file__).resolve().parent.parent

# Get settings from environment variables
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-ge9)a+1@8zel*ba@&m$4ltn-2nhoc0$)y1%#t15@4cn7o38052')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['*']  # Allow all hosts for development


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'authentication',
    'corsheaders',
    'fabric',
    'rest_framework',
    'rest_framework.authtoken',
    'cutting',
    'sewing',
    'finished_product',
    'packing_app',
    'reports',
    'order',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware', #Helps protect your site against common attacks (e.g., XSS, clickjacking).
    'django.middleware.security.SecurityMiddleware', 
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware', #Ensures that POST requests are coming from trusted sources, especially important for forms and APIs.
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

AUTH_USER_MODEL = 'authentication.CustomUser'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

# Local MySQL configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DATABASE_NAME', 'prifashion'),
        'USER': os.getenv('DATABASE_USER', 'root'),
        'PASSWORD': os.getenv('DATABASE_PASSWORD', 'boossa12'),
        'HOST': os.getenv('DATABASE_HOST', 'localhost'),
        'PORT': os.getenv('DATABASE_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}
print("Using Local MySQL Database")


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'

# Media files (Uploaded files)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, os.getenv('MEDIA_ROOT', 'media'))

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',  # Allow requests from this frontend
    'http://127.0.0.1:3000',  # Allow requests from Electron app
    'http://localhost:3005',  # Allow requests from Electron app (new port)
    'http://127.0.0.1:3005',  # Allow requests from Electron app (new port)
    'http://localhost:3006',  # Allow requests from Electron app (backup port)
    'http://127.0.0.1:3006',  # Allow requests from Electron app (backup port)
    'http://localhost:3007',  # Allow requests from Electron app (backup port)
    'http://127.0.0.1:3007',  # Allow requests from Electron app (backup port)
]

DEBUG = True

AUTH_USER_MODEL = 'authentication.CustomUser'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
}

# JWT settings
SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('JWT',),
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
}