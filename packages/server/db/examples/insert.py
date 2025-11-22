import os
from supabase import create_client

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Example data from Fintoc API
USER_ID = "550e8400-e29b-41d4-a716-446655440000"  # Your user UUID
LINK_ID = "link_nBOGdOijo7J0XWby"
ACCOUNT_ID = "acc_pvbQlvmTY8DyKEzw"

# Movement data from Fintoc
movement_data = {
    "id": "mov_pv5Yo1HojZJjd8gq",
    "description": "0211766417 TRANSF A CARLOS",
    "amount": -4800,
    "currency": "CLP",
    "post_date": "2025-11-24",
    "transaction_date": None,
    "type": "transfer",
    "status": "confirmed",
    "pending": False,
    "comment": None,
    "reference_id": None,
    "recipient_account": {
        "holder_id": "211766417",
        "number": None,
        "institution": None,
        "holder_name": "Carlos Efrain Pinto Urtubia",
    },
    "sender_account": None,
}

# Step 1: Create or get counterparty
counterparty = movement_data.get("recipient_account") or movement_data.get(
    "sender_account"
)

if counterparty:
    # Upsert counterparty
    cp_response = supabase.table("counterparties").upsert(
        {
            "user_id": USER_ID,
            "holder_id": counterparty["holder_id"],
            "holder_name": counterparty["holder_name"],
        }
    ).execute()

    counterparty_id = cp_response.data[0]["id"]
    counterparty_type = "recipient" if movement_data.get("recipient_account") else "sender"
else:
    counterparty_id = None
    counterparty_type = None

# Step 2: Insert movement
movement_insert = {
    "id": movement_data["id"],
    "account_id": ACCOUNT_ID,
    "link_id": LINK_ID,
    "user_id": USER_ID,
    "description": movement_data["description"],
    "amount": movement_data["amount"],
    "currency": movement_data["currency"],
    "movement_type": movement_data["type"].strip(),
    "status": movement_data["status"],
    "pending": movement_data["pending"],
    "post_date": movement_data["post_date"],
    "transaction_date": movement_data["transaction_date"],
    "comment": movement_data["comment"],
    "reference_id": movement_data["reference_id"],
    "counterparty_id": counterparty_id,
    "counterparty_type": counterparty_type,
}

response = supabase.table("movements").upsert(movement_insert).execute()

print("Movement inserted:")
print(response.data)
