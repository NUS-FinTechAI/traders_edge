"""
Pytest configuration and shared fixtures for tests.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the path so imports work correctly
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# Set environment variable to avoid loading actual database during tests
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
