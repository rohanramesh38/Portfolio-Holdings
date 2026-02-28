# Import all models here so Alembic can discover them.
from app.models.user import User  # noqa: F401
from app.models.holding import Holding  # noqa: F401
from app.models.transaction import Transaction  # noqa: F401