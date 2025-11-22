from typing import Generator
from fastapi import FastAPI
from sqlalchemy.orm import Session
from .db import SessionLocal
from contextlib import contextmanager

def get_session() -> Generator[Session, None, None]:
    """Dependency for getting database sessions."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
