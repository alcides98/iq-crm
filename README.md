# Wolf CRM

CRM a medida para Wolf Consulting Group.  
Desarrollado por **IQ Data** | Stack: Django 5 + React 18 + PostgreSQL + Celery + SIFEN

---

## Inicio rápido (desarrollo)

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Copiar y editar variables de entorno
copy ..\\.env.example .env

# Migraciones
python manage.py migrate_schemas --shared
python manage.py migrate_schemas

# Crear tenant y admin inicial
cd ..
python setup_dev.py

# Levantar servidor
cd backend
python manage.py runserver --settings=config.settings.development
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Celery (opcional para desarrollo)

```bash
# Requiere Redis corriendo
cd backend
celery -A config worker -l info
celery -A config beat -l info
```

### 4. Con Docker (producción)

```bash
cp .env.example .env
# Editar .env con tus valores reales
docker compose up -d
docker compose exec backend python manage.py migrate_schemas --shared
docker compose exec backend python manage.py migrate_schemas
```

---

## Acceso

| URL | Descripción |
|-----|-------------|
| `http://wolfcg.localhost:5173` | Frontend (dev) |
| `http://wolfcg.localhost:8000/api/v1/` | API REST |

**Credenciales iniciales:** `admin@wolfcg.com` / `wolfcrm2025`

---

## Estructura

```
wolf-crm/
├── backend/           # Django 5 + DRF
│   ├── apps/
│   │   ├── tenants/       # Multi-tenant
│   │   ├── authentication/ # JWT + roles
│   │   ├── clients/        # Clientes y contactos
│   │   ├── pipeline/       # Negociaciones (Kanban)
│   │   ├── tasks/          # Tareas y proyectos
│   │   ├── billing/        # Cobros y cuotas
│   │   ├── invoicing/      # SIFEN Paraguay
│   │   ├── notifications/  # Alertas por email
│   │   └── dashboard/      # KPIs y métricas
│   └── config/         # Settings, URLs, Celery
├── frontend/          # React 18 + Vite + Tailwind
│   └── src/
│       ├── pages/     # Dashboard, Pipeline, Clients...
│       ├── components/ # Layout, UI, Pipeline
│       ├── hooks/     # useAuth, usePipeline, useKPIs
│       ├── services/  # api.js, auth.js
│       ├── store/     # Zustand (auth, pipeline)
│       └── utils/     # formatGS, validateRUC
├── nginx/             # Config Nginx producción
├── docker-compose.yml
├── .env.example
└── setup_dev.py       # Script de inicialización
```

---

## Sprints

- **Sprint 1 ✅** — Setup base, modelos, layout
- **Sprint 2** — CRUD completo Clients + Pipeline Kanban interactivo
- **Sprint 3** — Dashboard KPIs + Tasks + Celery alerts
- **Sprint 4** — Billing + importador CSV
- **Sprint 5** — SIFEN + Deploy producción
