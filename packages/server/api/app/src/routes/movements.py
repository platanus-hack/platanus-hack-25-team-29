from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
from datetime import date
from ...deps import get_session

router = APIRouter()

@router.get("/")
def get_movements_by_date_range(
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    session: Session = Depends(get_session)
):
    """
    Retrieves movements within a date range.
    
    Parameters:
    - start_date: Optional start date (YYYY-MM-DD format). If not provided, no lower bound is applied.
    - end_date: Optional end date (YYYY-MM-DD format). If not provided, no upper bound is applied.
    
    Returns movements filtered by post_date between the specified dates (inclusive).
    """
    try:
        # Build the query dynamically based on provided parameters
        base_query = "SELECT * FROM movements"
        where_clauses = []
        params = {}
        
        if start_date:
            # Validate date format
            try:
                date.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid start_date format. Use YYYY-MM-DD format."
                )
            where_clauses.append("post_date >= :start_date")
            params["start_date"] = start_date
        
        if end_date:
            # Validate date format
            try:
                date.fromisoformat(end_date)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid end_date format. Use YYYY-MM-DD format."
                )
            where_clauses.append("post_date <= :end_date")
            params["end_date"] = end_date
        
        # Combine query with WHERE clauses if any
        if where_clauses:
            query = f"{base_query} WHERE {' AND '.join(where_clauses)} ORDER BY post_date DESC"
        else:
            query = f"{base_query} ORDER BY post_date DESC"
        
        # Execute the query
        result = session.execute(text(query), params)
        
        # Fetch all rows and convert to list of dictionaries
        columns = result.keys()
        movements = [dict(zip(columns, row)) for row in result.fetchall()]
        
        return {
            "success": True,
            "filters": {
                "start_date": start_date,
                "end_date": end_date
            },
            "movement_count": len(movements),
            "movements": movements
        }
    
    except HTTPException:
        # Re-raise HTTPExceptions (validation errors)
        raise
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

