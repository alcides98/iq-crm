@echo off
cd /d "c:\01.CLAUDIA\08. CRM\wolf-crm\backend"
venv\Scripts\python.exe manage.py runserver 0.0.0.0:8001 --settings=config.settings.development
