from .base import *
import os
import dj_database_url

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# ── Base de datos — Neon provee DATABASE_URL ───────────────────────────────────
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    parsed = dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    # django-tenants requiere su propio ENGINE (wrapper sobre psycopg2)
    parsed['ENGINE'] = 'django_tenants.postgresql_backend'
    DATABASES = {'default': parsed}

# ── Archivos estáticos (whitenoise sin Nginx) ──────────────────────────────────
MIDDLEWARE.insert(2, 'whitenoise.middleware.WhiteNoiseMiddleware')  # después de TenantHeaderMiddleware
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ── CORS ───────────────────────────────────────────────────────────────────────
origins_env = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if origins_env:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in origins_env.split(',') if o.strip()]

# ── Celery ─────────────────────────────────────────────────────────────────────
REDIS_URL = os.environ.get('REDIS_URL', '')
if REDIS_URL:
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

# ── Seguridad HTTPS ────────────────────────────────────────────────────────────
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
