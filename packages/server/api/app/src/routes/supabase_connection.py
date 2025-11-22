from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from ...deps import get_session

router = APIRouter()

@router.get("/tables")
def get_database_tables(session: Session = Depends(get_session)):
    """
    Connects to the database and retrieves all table names using the session dependency.
    Prints the table names to the console and returns them as a response.
    """
    try:
        # Use the engine from the session to inspect
        engine = session.bind
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        
        # Print table names to console
        print("=" * 50)
        print("DATABASE TABLES (via Session):")
        print("=" * 50)
        for table in table_names:
            print(f"  - {table}")
        print("=" * 50)
        print(f"Total tables found: {len(table_names)}")
        print("=" * 50)
        
        return {
            "success": True,
            "table_count": len(table_names),
            "tables": table_names
        }
    
    except SQLAlchemyError as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
