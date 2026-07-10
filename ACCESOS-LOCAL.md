# Wolf CRM — Accesos Entorno Local

## URLs

| Servicio | URL |
|---|---|
| **Frontend (CRM)** | http://localhost:3000 |
| **Backend API** | http://localhost:8000/api/v1/ |
| **Django Admin** | http://localhost:8000/admin/ |

---

## Usuarios

| Nombre | Email | Contraseña | Rol |
|---|---|---|---|
| Alcides Cardozo | acardozo@iqdata.com.py | Ac779808. | Owner (Dueño) |

---

## Servicios Docker

| Servicio | Host | Puerto |
|---|---|---|
| PostgreSQL | localhost | 5433 |
| Redis | localhost | 6380 |

---

## Comandos para levantar el proyecto

```powershell
# 1. Docker — PostgreSQL + Redis
cd "c:\01.CLAUDIA\08. CRM\wolf-crm"
docker compose up -d db redis

# 2. Backend Django (Terminal 1)
cd backend
.\venv\Scripts\activate
python manage.py runserver 8000

# 3. Frontend React (Terminal 2)
cd frontend
npm run dev
```

---

*Wolf CRM v1.0 — Desarrollado por IQ Data*
