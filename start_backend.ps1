$dir = "c:\01.CLAUDIA\08. CRM\wolf-crm\backend"
Set-Location $dir
& "$dir\venv\Scripts\python.exe" "$dir\manage.py" runserver 0.0.0.0:8001 --settings=config.settings.development
