from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, first_name=first_name, last_name=last_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'owner')
        return self.create_user(email, first_name, last_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('owner', 'Dueño'),
        ('admin', 'Administrador'),
        ('admin_usuario', 'Admin Usuario'),
        ('collaborator', 'Colaborador'),
        ('colaborador', 'Colaborador'),
    ]
    ADMIN_ROLES = ['owner', 'admin', 'admin_usuario']
    COLLAB_ROLES = ['collaborator', 'colaborador']

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLES, default='collaborator')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.first_name} {self.last_name} <{self.email}>'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def is_admin(self):
        return self.role in self.ADMIN_ROLES


class CompanySettings(models.Model):
    name = models.CharField(max_length=200, default='Mi Empresa')
    tagline = models.CharField(max_length=300, blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    logo_url = models.URLField(blank=True)
    website = models.URLField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=300, blank=True)
    ruc = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuración de empresa'

    def __str__(self):
        return self.name

    @classmethod
    def get_default(cls):
        obj, _ = cls.objects.get_or_create(pk=1, defaults={'name': 'Mi Empresa'})
        return obj
