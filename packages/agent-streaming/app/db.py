from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)
load_dotenv()

class Base(DeclarativeBase):
    pass

database_url = os.getenv("DATABASE_URL")

# Lazy initialization - engine created on first access
_engine = None
_SessionLocal = None

def get_engine():
    """Get or create database engine lazily."""
    global _engine
    if _engine is None:
        logger.info("Creating database engine...")
        _engine = create_engine(
            database_url,
            poolclass=NullPool,
            connect_args={
                "connect_timeout": 10,
                "options": "-c statement_timeout=30000"
            }
        )
        logger.info("Database engine created successfully")
    return _engine

def get_session():
    """Get database session factory lazily."""
    global _SessionLocal
    if _SessionLocal is None:
        logger.info("Creating SessionLocal...")
        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_engine()
        )
    return _SessionLocal()

def SessionLocal():
    """For backward compatibility."""
    return get_session()
