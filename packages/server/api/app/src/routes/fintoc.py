import os
import requests
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...deps import get_session
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

FINTOC_SECRET_KEY = os.getenv("FINTOC_SECRET_KEY")
BASE_URL = "https://api.fintoc.com/v1"

def get_fintoc_headers():
    if not FINTOC_SECRET_KEY:
        raise HTTPException(status_code=500, detail="FINTOC_SECRET_KEY not set")
    return {"Authorization": FINTOC_SECRET_KEY}

def fetch_accounts(link_token: str) -> List[Dict[str, Any]]:
    url = f"{BASE_URL}/accounts"
    headers = get_fintoc_headers()
    params = {"link_token": link_token}
    
    print(f"Fetching accounts for link token...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            return data
        return data.get("data", [])
    else:
        print(f"Error fetching accounts: {response.status_code} - {response.text}")
        raise HTTPException(status_code=response.status_code, detail=f"Fintoc API Error: {response.text}")

def fetch_movements(account_id: str, link_token: str) -> List[Dict[str, Any]]:
    url = f"{BASE_URL}/accounts/{account_id}/movements"
    headers = get_fintoc_headers()
    
    all_movements = []
    page = 1
    per_page = 300
    
    print(f"Fetching movements for account: {account_id}")
    
    while True:
        params = {"link_token": link_token, "page": page, "per_page": per_page}
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"Error fetching movements page {page}: {response.status_code}")
            break
            
        data = response.json()
        page_movements = []
        if isinstance(data, list):
            page_movements = data
        else:
            page_movements = data.get("movements") or data.get("data") or []
            
        if not page_movements:
            break
            
        all_movements.extend(page_movements)
        
        if len(page_movements) < per_page:
            break
            
        page += 1
        
    return all_movements

def get_or_create_user(session: Session) -> str:
    # Try to get a user
    result = session.execute(text("SELECT id FROM users LIMIT 1"))
    user = result.fetchone()
    if user:
        return str(user[0])
    
    # Create a user if none exists
    email = "test@example.com"
    print(f"Creating new user with email {email}")
    session.execute(
        text("INSERT INTO users (email) VALUES (:email)"),
        {"email": email}
    )
    session.commit()
    
    result = session.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
    return str(result.scalar())

def fetch_link_details(link_id: str, token: str) -> Dict[str, Any]:
    """
    Fetch link details from Fintoc API to get institution and holder information
    """
    url = f"{BASE_URL}/links/{link_id}"
    headers = get_fintoc_headers()
    params = {"link_token": token}
    
    print(f"Fetching link details for link_id: {link_id}")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Successfully fetched link details")
        return data
    else:
        print(f"Warning: Could not fetch link details: {response.status_code} - {response.text}")
        return {}

def upsert_link(session: Session, link_id: str, user_id: str, token: str):
    """
    Upsert link with full details from Fintoc API
    """
    # Fetch link details from Fintoc API
    link_details = fetch_link_details(link_id, token)
    
    # Extract information from Fintoc response
    holder_id = link_details.get("holder_id", "unknown")
    holder_type = link_details.get("holder_type")
    username = link_details.get("username")
    
    institution = link_details.get("institution", {})
    institution_id = institution.get("id", "unknown")
    institution_name = institution.get("name")
    institution_country = institution.get("country")
    
    mode = link_details.get("mode")
    status = link_details.get("status", "active")
    active = link_details.get("active", True)
    refresh_status = link_details.get("refresh_status")
    last_refreshed_at = link_details.get("last_time_refreshed")
    
    print(f"Upserting link with institution: {institution_name or 'Unknown'}")
    print(f"  - Link ID: {link_id}")
    print(f"  - Full token: {token[:50]}...")
    
    query = text("""
        INSERT INTO fintoc_links (
            id, user_id, holder_id, username, holder_type,
            institution_id, institution_name, institution_country,
            mode, active, status, refresh_status, last_refreshed_at
        )
        VALUES (
            :id, :user_id, :holder_id, :username, :holder_type,
            :institution_id, :institution_name, :institution_country,
            :mode, :active, :status, :refresh_status, :last_refreshed_at
        )
        ON CONFLICT (user_id, id) DO UPDATE SET
            holder_id = EXCLUDED.holder_id,
            username = EXCLUDED.username,
            holder_type = EXCLUDED.holder_type,
            institution_id = EXCLUDED.institution_id,
            institution_name = EXCLUDED.institution_name,
            institution_country = EXCLUDED.institution_country,
            mode = EXCLUDED.mode,
            active = EXCLUDED.active,
            status = EXCLUDED.status,
            refresh_status = EXCLUDED.refresh_status,
            last_refreshed_at = EXCLUDED.last_refreshed_at,
            updated_at = NOW()
    """)
    
    session.execute(query, {
        "id": token,  # Save the full token as ID
        "user_id": user_id,
        "holder_id": holder_id,
        "username": username,
        "holder_type": holder_type,
        "institution_id": institution_id,
        "institution_name": institution_name,
        "institution_country": institution_country,
        "mode": mode,
        "active": active,
        "status": status,
        "refresh_status": refresh_status,
        "last_refreshed_at": last_refreshed_at
    })

def upsert_account(session: Session, account: Dict[str, Any], link_id: str, user_id: str):
    # Upsert account
    # account data has: id, name, number, holder_id, currency, balance...
    
    balance = account.get("balance", {})
    
    query = text("""
        INSERT INTO fintoc_accounts (
            id, link_id, user_id, 
            name, official_name, number, 
            holder_name, currency, 
            balance_available, balance_current, balance_limit,
            type
        )
        VALUES (
            :id, :link_id, :user_id, 
            :name, :official_name, :number, 
            :holder_name, :currency, 
            :balance_available, :balance_current, :balance_limit,
            :type
        )
        ON CONFLICT (user_id, id) DO UPDATE SET
            balance_available = EXCLUDED.balance_available,
            balance_current = EXCLUDED.balance_current,
            updated_at = NOW()
    """)
    
    params = {
        "id": account.get("id"),
        "link_id": link_id,
        "user_id": user_id,
        "name": account.get("name"),
        "official_name": account.get("official_name"),
        "number": account.get("number"),
        "holder_name": account.get("holder_name"),
        "currency": account.get("currency", "CLP"),
        "balance_available": balance.get("available"),
        "balance_current": balance.get("current"),
        "balance_limit": balance.get("limit"),
        "type": account.get("type")
    }
    
    # Need to map params to sql placeholders carefully? 
    # Actually 'type' is a reserved word in some contexts, but here it's a column name 'account_type' in init.sql?
    # Let's check init.sql again.
    # init.sql: account_type text
    # account object has 'type'?
    
    # Correcting column names based on init.sql
    # columns: account_type, account_number (instead of number)
    
    query = text("""
        INSERT INTO fintoc_accounts (
            id, link_id, user_id, 
            name, official_name, account_number, 
            holder_name, currency, 
            balance_available, balance_current, balance_limit,
            account_type
        )
        VALUES (
            :id, :link_id, :user_id, 
            :name, :official_name, :account_number, 
            :holder_name, :currency, 
            :balance_available, :balance_current, :balance_limit,
            :account_type
        )
        ON CONFLICT (user_id, id) DO UPDATE SET
            balance_available = EXCLUDED.balance_available,
            balance_current = EXCLUDED.balance_current,
            updated_at = NOW()
    """)
    
    params["account_number"] = account.get("number")
    params["account_type"] = account.get("type")
    
    session.execute(query, params)

def upsert_movement(session: Session, movement: Dict[str, Any], account_id: str, link_id: str, user_id: str):
    # Upsert movement
    # movement data: id, description, amount, currency, post_date, transaction_date, etc.
    
    query = text("""
        INSERT INTO movements (
            id, account_id, link_id, user_id,
            description, amount, currency,
            movement_type, status, pending,
            post_date, transaction_date,
            comment, reference_id
        )
        VALUES (
            :id, :account_id, :link_id, :user_id,
            :description, :amount, :currency,
            :movement_type, :status, :pending,
            :post_date, :transaction_date,
            :comment, :reference_id
        )
        ON CONFLICT (user_id, id) DO NOTHING
    """)
    
    params = {
        "id": movement.get("id"),
        "account_id": account_id,
        "link_id": link_id,
        "user_id": user_id,
        "description": movement.get("description"),
        "amount": movement.get("amount"),
        "currency": movement.get("currency"),
        "movement_type": movement.get("type"), # init.sql: movement_type
        "status": movement.get("status"),
        "pending": movement.get("pending", False),
        "post_date": movement.get("post_date"),
        "transaction_date": movement.get("transaction_date"),
        "comment": movement.get("comment"),
        "reference_id": movement.get("reference_id")
    }
    
    session.execute(query, params)


@router.get("/accounts")
def get_accounts(
    user_id: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    """
    Get all accounts for a user from the database with institution information.
    """
    try:
        if not user_id:
            user_id = get_or_create_user(session)
        
        query = text("""
            SELECT 
                fa.id,
                fa.link_id,
                fa.user_id,
                fa.account_type,
                fa.account_number,
                fa.name,
                fa.official_name,
                fa.holder_name,
                fa.currency,
                fa.balance_available,
                fa.balance_current,
                fa.balance_limit,
                fa.refreshed_at,
                fa.created_at,
                fa.updated_at,
                fl.institution_name,
                fl.institution_id,
                fl.institution_country
            FROM fintoc_accounts fa
            LEFT JOIN fintoc_links fl ON fa.link_id = fl.id
            WHERE fa.user_id = :user_id
            ORDER BY fa.created_at DESC
        """)
        
        result = session.execute(query, {"user_id": user_id})
        columns = result.keys()
        accounts = [dict(zip(columns, row)) for row in result.fetchall()]
        
        return {
            "success": True,
            "count": len(accounts),
            "accounts": accounts
        }
    
    except Exception as e:
        print(f"Error fetching accounts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/movements")
def get_movements(
    user_id: Optional[str] = Query(None),
    account_id: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    """
    Get movements for a user, optionally filtered by account.
    """
    try:
        if not user_id:
            user_id = get_or_create_user(session)
        
        if account_id:
            query = text("""
                SELECT * FROM movements
                WHERE user_id = :user_id AND account_id = :account_id
                ORDER BY post_date DESC
            """)
            result = session.execute(query, {"user_id": user_id, "account_id": account_id})
        else:
            query = text("""
                SELECT * FROM movements
                WHERE user_id = :user_id
                ORDER BY post_date DESC
            """)
            result = session.execute(query, {"user_id": user_id})
        
        columns = result.keys()
        movements = [dict(zip(columns, row)) for row in result.fetchall()]
        
        return {
            "success": True,
            "count": len(movements),
            "movements": movements
        }
    
    except Exception as e:
        print(f"Error fetching movements: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync")
def sync_fintoc_data(
    user_id: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    """
    Fetch data from Fintoc and populate the database.
    Requires that the user has already connected their bank account via the Fintoc widget.
    The link token must be stored in the database before calling this endpoint.
    
    Returns 400 error if no bank account is connected.
    """
    try:
        # 1. Ensure User
        if not user_id:
            user_id = get_or_create_user(session)
        
        # 2. Get token from database
        # The token should have been saved by the token_gatherer webhook
        query = text("SELECT token FROM token LIMIT 1")
        result = session.execute(query)
        token_record = result.fetchone()
        
        if not token_record:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "NO_BANK_CONNECTED",
                    "message": "No bank account connected. Please connect your bank account using the Fintoc widget first.",
                    "instructions": "Use the Fintoc widget to connect your bank account before syncing data."
                }
            )
        
        # The token from the database
        token = token_record[0]
        
        print(f"Using token from database: {token[:30]}...")
        print(f"User ID: {user_id}")
        
        # 3. Fetch Accounts
        accounts = fetch_accounts(token)
        print(f"Fetched {len(accounts)} accounts")
        
        # Extract link_id from token (format: link_XXX_token_YYY)
        link_id = token.split("_token_")[0] if "_token_" in token else token
        
        # Upsert the link with full details from Fintoc API
        # Note: We save the full token as the ID in fintoc_links
        upsert_link(session, link_id, user_id, token)
        
        total_movements = 0
        
        for account in accounts:
            # Upsert Account - use full token as link_id
            upsert_account(session, account, token, user_id)
            
            account_id = account.get("id")
            if not account_id:
                continue
                
            # Fetch Movements
            movements = fetch_movements(account_id, token)
            
            for mov in movements:
                # Use full token as link_id
                upsert_movement(session, mov, account_id, token, user_id)
            
            total_movements += len(movements)
            
        session.commit()
        
        return {
            "success": True,
            "accounts_synced": len(accounts),
            "movements_synced": total_movements,
            "user_id": user_id,
            "token": token[:30] + "..."
        }

    except Exception as e:
        session.rollback()
        print(f"Error syncing fintoc data: {e}")
        raise HTTPException(status_code=500, detail=str(e))