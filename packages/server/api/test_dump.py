#!/usr/bin/env python3
"""
Script to fetch bank movements using Fintoc API and save to local JSON DB.

Before running:
1. Create a .env file: cp .env.example .env
2. Add your Fintoc Secret Key to .env
3. Get your link_token from the Fintoc Dashboard (https://app.fintoc.com)
4. Install requests: pip install requests python-dotenv
"""

import os
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
FINTOC_SECRET_KEY = os.getenv("FINTOC_SECRET_KEY")
LINK_TOKEN = os.getenv("LINK_TOKEN")
BASE_URL = "https://api.fintoc.com/v1"
DB_PATH = Path(__file__).parent.parent / "db" / "example_data.json"


def save_to_db(accounts, movements_map):
    """Save fetched data to the JSON database file."""
    data = {
        "accounts": accounts,
        "balances": [],  # Balances are often part of account or fetched separately
        "movements": [],
    }

    # Process accounts to match our schema if needed
    # The API returns accounts, we might need to extract balance info
    for acc in accounts:
        # Extract balance if present
        if "balance" in acc:
            balance_info = acc["balance"]
            data["balances"].append(
                {
                    "id": acc["id"] + "_bal",  # Mock ID
                    "account_id": acc["id"],
                    "available": balance_info.get("available"),
                    "current": balance_info.get("current"),
                    "limit_amount": balance_info.get("limit"),
                    "currency": acc.get("currency", "CLP"),
                }
            )

    # Process movements
    for acc_id, moves in movements_map.items():
        for m in moves:
            # Ensure the movement has the account_id
            m["account_id"] = acc_id
            # Add other fields to match our schema if missing from API response
            if "pending" not in m:
                m["pending"] = False  # Default
            data["movements"].append(m)

    print(
        f"Saving {len(data['accounts'])} accounts and {len(data['movements'])} movements to {DB_PATH}"
    )

    # Ensure directory exists
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=4)


def fetch_accounts(link_token):
    """Fetch all accounts associated with a link."""
    url = f"{BASE_URL}/accounts"
    headers = {"Authorization": FINTOC_SECRET_KEY}
    params = {"link_token": link_token}

    print(f"Fetching accounts for link token")
    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching accounts: {response.status_code}")
        print(response.text)
        return []


def fetch_movements(account_id, link_token):
    """Fetch all movements (transactions) for a specific account, handling pagination."""
    url = f"{BASE_URL}/accounts/{account_id}/movements"
    headers = {"Authorization": FINTOC_SECRET_KEY}

    all_movements = []
    page = 1
    per_page = 100  # Maximize page size to reduce requests (max is usually 300)

    print(f"\nFetching movements for account: {account_id}")

    while True:
        params = {"link_token": link_token, "page": page, "per_page": per_page}

        print(f"  Fetching page {page}...")
        response = requests.get(url, headers=headers, params=params)

        if response.status_code != 200:
            print(f"Error fetching movements page {page}: {response.status_code}")
            print(response.text)
            break

        data = response.json()
        # Extract movements list (handle raw list or dict with 'data'/'movements' key)
        if isinstance(data, list):
            page_movements = data
        else:
            # Fintoc usually returns a list or object with 'movements' key?
            # Based on example_data.json it looks like we expect a list of objects?
            # But usually API returns { "movements": [...] } or similar wrapper.
            # Let's handle common patterns.
            page_movements = data.get("movements") or data.get("data") or []

        if not page_movements:
            break

        all_movements.extend(page_movements)

        # Check if we should continue (if we got fewer items than requested, we're done)
        if len(page_movements) < per_page:
            break

        page += 1

    return all_movements


def main():
    # Validate configuration
    if not FINTOC_SECRET_KEY:
        print("ERROR: Please set FINTOC_SECRET_KEY in your .env file")
        # For testing purposes without keys, we can skip return
        # return

    if not LINK_TOKEN:
        print("ERROR: Please set LINK_TOKEN in your .env file")
        # return

    # Step 1: Fetch all accounts
    # Handle case where fetch returns None or list
    accounts_data = fetch_accounts(LINK_TOKEN) if LINK_TOKEN else []

    # If API call failed or returned no data, use empty list
    accounts = []
    if accounts_data:
        accounts = (
            accounts_data
            if isinstance(accounts_data, list)
            else accounts_data.get("data", [])
        )

    print(f"\nFound {len(accounts)} account(s):")

    movements_map = {}

    for i, account in enumerate(accounts, 1):
        account_id = account.get("id")
        account_name = account.get("name", "Unknown")
        print(f"Fetching movements for {account_name} ({account_id})...")

        # Step 2: Fetch movements for each account
        movements_data = fetch_movements(account_id, LINK_TOKEN)
        if movements_data:
            # Handle pagination/list response structure
            moves = (
                movements_data
                if isinstance(movements_data, list)
                else movements_data.get("data", [])
            )
            movements_map[account_id] = moves
            print(f"  Found {len(moves)} movements")

    # Step 3: Save everything to DB
    # Only save if we actually fetched something, OR if we want to overwrite with mock data for testing
    if accounts or movements_map:
        save_to_db(accounts, movements_map)
    else:
        print("No data fetched, skipping save.")


if __name__ == "__main__":
    main()
