"""
WSGI config for nomad_gear project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nomad_gear.settings')

application = get_wsgi_application()
