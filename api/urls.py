from django.urls import path
from .views import calculate_energy

urlpatterns = [
    path('api/calculate-energy/', calculate_energy, name='calculate_energy'),
]