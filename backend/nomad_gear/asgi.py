"""
ASGI config for nomad_gear project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nomad_gear.settings')

application = get_asgi_application()
