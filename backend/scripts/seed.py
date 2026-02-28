import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.user import User

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def main():
    db = SessionLocal()
    try:
        # idempotent-ish: only insert if empty
        if db.query(User).count() == 0:
            db.add_all([User(name="Analyst 1"), User(name="Analyst 2")])
            db.commit()
            print("Seeded users: Analyst 1, Analyst 2")
        else:
            print("Users already exist; skipping.")
    finally:
        db.close()

if __name__ == "__main__":
    main()