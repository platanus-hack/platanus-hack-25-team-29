"""
Fintoc Token Gatherer - Backend
Handles Fintoc widget configuration and link token webhook reception
"""

import os
import json
import base64
import requests
from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...deps import get_session
from fastapi import Depends
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Fintoc Configuration
FINTOC_SECRET_KEY = os.getenv("FINTOC_SECRET_KEY")
FINTOC_PUBLIC_KEY = os.getenv("FINTOC_PUBLIC_KEY")

def get_webhook_url() -> str:
    """
    Get the correct webhook URL for Fintoc.
    Tries to auto-detect ngrok tunnel, otherwise uses env variable.
    """
    # Try to detect ngrok tunnel
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
        if response.status_code == 200:
            tunnels = response.json().get("tunnels", [])
            for tunnel in tunnels:
                if tunnel.get("proto") == "https":
                    public_url = tunnel.get("public_url")
                    print(f"🎯 Auto-detected ngrok URL: {public_url}")
                    return f"{public_url}/api/fintoc/webhook/link-token"
    except Exception as e:
        print(f"Could not detect ngrok: {e}")
    
    # Fallback to environment variable
    webhook_base = os.getenv("WEBHOOK_URL", "http://localhost:8000")
    return f"{webhook_base}/api/fintoc/webhook/link-token"


def exchange_link_token(link_token: str) -> Dict[str, Any]:
    """
    Exchange temporary link token for permanent link credentials.
    Returns link_id and access_token from Fintoc.
    
    According to Fintoc API: The link token from the widget is temporary
    and must be exchanged for permanent credentials in the format:
    LINK_ID_token_LINK_ACCESS_TOKEN
    
    See: https://docs.fintoc.com/reference/errors
    """
    if not FINTOC_SECRET_KEY:
        raise Exception("FINTOC_SECRET_KEY not configured")
    
    # Use the Links Exchange endpoint
    url = f"https://api.fintoc.com/v1/links/{link_token}/exchange"
    headers = {"Authorization": FINTOC_SECRET_KEY}
    
    print(f"🔄 Exchanging link token with Fintoc...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Successfully exchanged link token")
        print(f"   Response: {json.dumps(result, indent=2)}")
        return result
    else:
        error_msg = f"Failed to exchange link token: {response.status_code} - {response.text}"
        print(f"❌ {error_msg}")
        print(f"   Check: https://docs.fintoc.com/reference/errors")
        raise Exception(error_msg)


@router.get("/widget-config")
async def get_widget_config(
    user_id: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    """
    Get Fintoc widget configuration
    Returns the configuration needed to initialize the Fintoc widget on the frontend
    """
    try:
        if not FINTOC_PUBLIC_KEY:
            raise HTTPException(
                status_code=500,
                detail="FINTOC_PUBLIC_KEY is not configured. Please set it in your environment variables."
            )
        
        # Get or create user
        if not user_id:
            # Get first user or create one
            result = session.execute(text("SELECT id FROM users LIMIT 1"))
            user = result.fetchone()
            if user:
                user_id = str(user[0])
            else:
                # Create default user
                session.execute(
                    text("INSERT INTO users (email) VALUES (:email)"),
                    {"email": "default@example.com"}
                )
                session.commit()
                result = session.execute(text("SELECT id FROM users WHERE email = :email"), 
                                       {"email": "default@example.com"})
                user_id = str(result.scalar())
        
        # Get webhook URL (with auto-detection)
        webhook_url = get_webhook_url()
        
        # Create state parameter with user information
        state_data = {
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        state_param = base64.urlsafe_b64encode(
            json.dumps(state_data).encode()
        ).decode()
        
        # Append state to webhook URL
        webhook_url_with_state = f"{webhook_url}?state={state_param}"
        
        config = {
            "public_key": FINTOC_PUBLIC_KEY,
            "webhook_url": webhook_url_with_state,
            "holder_type": "individual",
            "product": "movements",
            "country": "cl"  # Chile - change to 'mx' for Mexico
        }
        
        print(f"✅ Widget config generated for user {user_id}")
        print(f"🔗 Webhook URL: {webhook_url_with_state[:80]}...")
        
        return JSONResponse(content={"data": config})
        
    except Exception as e:
        print(f"❌ Error generating widget config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/link-token")
async def handle_link_token_webhook(
    request: Request,
    state: str = Query(...),
    session: Session = Depends(get_session)
):
    """
    Webhook endpoint to receive link tokens from Fintoc
    This is called by Fintoc when a user successfully connects their bank account
    """
    try:
        # Get webhook data
        data = await request.json()
        
        print(f"📥 Webhook received: {json.dumps(data, indent=2)}")
        
        # Extract link token from webhook (Fintoc nests it under 'data')
        link_token = None
        if "data" in data and isinstance(data["data"], dict):
            link_token = data["data"].get("link_token")
        if not link_token:
            # Fallback to direct access
            link_token = data.get("link_token") or data.get("token")
        
        if not link_token:
            print("❌ No link token found in webhook payload")
            raise HTTPException(status_code=400, detail="No link token in webhook")
        
        # Decode state to get user information
        try:
            state_data = json.loads(base64.urlsafe_b64decode(state).decode())
            user_id = state_data.get("user_id")
            if not user_id:
                raise HTTPException(status_code=400, detail="No user_id in state")
        except Exception as e:
            print(f"❌ Error decoding state: {e}")
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        print(f"✅ Processing webhook for user {user_id}, link_token: {link_token[:20]}...")
        
        # Exchange the temporary link token for permanent credentials
        try:
            link_credentials = exchange_link_token(link_token)
            link_id = link_credentials.get("link_id")
            access_token = link_credentials.get("access_token")
            
            if not link_id or not access_token:
                raise Exception("Missing link_id or access_token in exchange response")
            
            # Create the full link token in Fintoc API format
            full_link_token = f"{link_id}_token_{access_token}"
            print(f"✅ Got link credentials - link_id: {link_id}")
            
        except Exception as e:
            print(f"❌ Error exchanging link token: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to exchange link token: {str(e)}")
        
        # Extract additional data from webhook
        institution = None
        institution_id = None
        holder_name = None
        holder_id = None
        
        if "data" in data:
            webhook_data = data["data"]
            institution = webhook_data.get("institution", {}).get("name")
            institution_id = webhook_data.get("institution", {}).get("id")
            holder_name = webhook_data.get("holder_name")
            holder_id = webhook_data.get("holder_id")
        
        # Store the token in the token table
        # First, clear any existing token
        session.execute(text("DELETE FROM token"))
        
        # Insert the new token
        insert_query = text("INSERT INTO token (token) VALUES (:token)")
        session.execute(insert_query, {"token": full_link_token})
        session.commit()
        
        print(f"💾 Token saved: {full_link_token[:30]}...")
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "Link token received and stored",
                "link_id": link_id,
                "user_id": user_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-link")
async def save_link_token(
    request: Request,
    session: Session = Depends(get_session)
):
    """
    Direct endpoint to save link token from client
    Alternative to webhook for when webhook is not accessible
    This is called by the frontend after successful widget connection
    """
    try:
        data = await request.json()
        link_token = data.get("link_token")
        user_id = data.get("user_id")
        
        if not link_token:
            raise HTTPException(status_code=400, detail="link_token is required")
        
        print(f"📥 Saving link token from client for user: {user_id or 'default'}")
        
        # Get or create user
        if not user_id:
            result = session.execute(text("SELECT id FROM users LIMIT 1"))
            user = result.fetchone()
            if user:
                user_id = str(user[0])
            else:
                session.execute(
                    text("INSERT INTO users (email) VALUES (:email)"),
                    {"email": "default@example.com"}
                )
                session.commit()
                result = session.execute(text("SELECT id FROM users WHERE email = :email"), 
                                       {"email": "default@example.com"})
                user_id = str(result.scalar())
        
        print(f"📥 Processing link token for user {user_id}")
        
        # Exchange the link token
        try:
            link_credentials = exchange_link_token(link_token)
            link_id = link_credentials.get("link_id")
            access_token = link_credentials.get("access_token")
            
            if not link_id or not access_token:
                raise Exception("Missing link_id or access_token")
            
            full_link_token = f"{link_id}_token_{access_token}"
            print(f"✅ Got link credentials - link_id: {link_id}")
            
        except Exception as e:
            print(f"❌ Error exchanging link token: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to exchange link token: {str(e)}")
        
        # Save to database
        # First, clear any existing token
        session.execute(text("DELETE FROM token"))
        
        # Insert the new token
        insert_query = text("INSERT INTO token (token) VALUES (:token)")
        session.execute(insert_query, {"token": full_link_token})
        session.commit()
        
        print(f"💾 Token saved: {full_link_token[:30]}...")
        
        return JSONResponse(content={
            "status": "success",
            "message": "Link token saved",
            "link_id": link_id,
            "user_id": user_id
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_fintoc_status():
    """
    Check Fintoc integration status
    """
    return {
        "fintoc_configured": bool(FINTOC_SECRET_KEY and FINTOC_PUBLIC_KEY),
        "webhook_url": get_webhook_url(),
        "secret_key_present": bool(FINTOC_SECRET_KEY),
        "public_key_present": bool(FINTOC_PUBLIC_KEY)
    }