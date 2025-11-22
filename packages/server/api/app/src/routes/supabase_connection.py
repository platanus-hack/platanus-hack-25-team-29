from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Any, Dict
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

@router.get("/movements")
def get_movements(session: Session = Depends(get_session)):
    """
    Connects to the database and retrieves all movements using the session dependency.
    Prints the movements to the console and returns them as a response.
    """
    try:
        # Query all rows from the movements table
        result = session.execute(text("SELECT * FROM movements"))
        
        # Fetch all rows and convert to list of dictionaries
        columns = result.keys()
        movements = [dict(zip(columns, row)) for row in result.fetchall()]
        
        # Print movements to console
        # print("=" * 50)
        # print("MOVEMENTS FROM DATABASE:")
        # print("=" * 50)
        # for movement in movements:
        #     print(f"  {movement}")
        # print("=" * 50)
        print(f"Total movements found: {len(movements)}")
        # print("=" * 50)
        
        return {
            "success": True,
            "movement_count": len(movements),
            "movements": movements
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

@router.post("/movements")
def insert_movements(movements: List[Dict[str, Any]], session: Session = Depends(get_session)):
    """
    Inserts multiple movement records into the movements table.
    Accepts a list of movement objects (dictionaries) and inserts them into the database.
    """
    if not movements:
        raise HTTPException(
            status_code=400,
            detail="No movements provided. Please provide a list of movement objects."
        )
    
    try:
        # Get the column names from the first movement
        columns = list(movements[0].keys())
        column_names = ", ".join(columns)
        
        # Create placeholders for the VALUES clause
        placeholders = ", ".join([f":{col}" for col in columns])
        
        # Build the INSERT query
        insert_query = text(f"INSERT INTO movements ({column_names}) VALUES ({placeholders})")
        
        # Execute the insert for each movement
        inserted_count = 0
        for movement in movements:
            session.execute(insert_query, movement)
            inserted_count += 1
        
        # Commit the transaction
        session.commit()
        
        # Print to console
        print("=" * 50)
        print(f"INSERTED {inserted_count} MOVEMENTS INTO DATABASE")
        print("=" * 50)
        for i, movement in enumerate(movements, 1):
            print(f"  {i}. {movement}")
        print("=" * 50)
        
        return {
            "success": True,
            "inserted_count": inserted_count,
            "message": f"Successfully inserted {inserted_count} movements"
        }
    
    except SQLAlchemyError as e:
        session.rollback()
        print(f"Database error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Database insertion error: {str(e)}"
        )
    except Exception as e:
        session.rollback()
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
