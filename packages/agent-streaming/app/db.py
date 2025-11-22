from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv
import os
import logging
import socket

logger = logging.getLogger(__name__)
load_dotenv()

class Base(DeclarativeBase):
    pass

def force_ipv4_resolution(hostname):
    """Resolve hostname to IPv4 address to avoid IPv6 connectivity issues."""
    try:
        ipv4_address = socket.getaddrinfo(hostname, None, socket.AF_INET)[0][4][0]
        logger.info(f"Resolved {hostname} to IPv4: {ipv4_address}")
        return ipv4_address
    except Exception as e:
        logger.warning(f"Failed to resolve {hostname} to IPv4: {e}")
        return hostname

database_url = os.getenv("DATABASE_URL")

# Force IPv4 by resolving Supabase hostname (fixes IPv6 network unreachable error)
if database_url and "db.lioyqtjrzclfcpdbonso.supabase.co" in database_url:
    ipv4_address = force_ipv4_resolution("db.lioyqtjrzclfcpdbonso.supabase.co")
    database_url = database_url.replace("db.lioyqtjrzclfcpdbonso.supabase.co", ipv4_address)

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
