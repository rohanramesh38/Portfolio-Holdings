from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

with engine.connect() as conn:
    print(conn.execute(text("select version()")).one())