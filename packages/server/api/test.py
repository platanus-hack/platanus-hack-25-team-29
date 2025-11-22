#!/usr/bin/env python3
"""
Simple test script to fetch bank movements using Fintoc API.

Before running:
1. Create a .env file: cp .env.example .env
2. Add your Fintoc Secret Key to .env
3. Get your link_token from the Fintoc Dashboard (https://app.fintoc.com)
4. Install requests: pip install requests python-dotenv
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
FINTOC_SECRET_KEY = os.getenv('FINTOC_SECRET_KEY')
LINK_TOKEN = os.getenv('LINK_TOKEN')
BASE_URL = 'https://api.fintoc.com/v1'


def fetch_accounts(link_token):
    """Fetch all accounts associated with a link."""
    url = f'{BASE_URL}/accounts'
    headers = {
        'Authorization': FINTOC_SECRET_KEY
    }
    params = {
        'link_token': link_token
    }

    print(f"Fetching accounts for link token")
    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching accounts: {response.status_code}")
        print(response.text)
        return None


def fetch_movements(account_id, link_token):
    """Fetch movements (transactions) for a specific account."""
    url = f'{BASE_URL}/accounts/{account_id}/movements'
    headers = {
        'Authorization': FINTOC_SECRET_KEY
    }
    params = {
        'link_token': link_token
    }

    print(f"\nFetching movements for account: {account_id}")
    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching movements: {response.status_code}")
        print(response.text)
        return None


def display_movements(movements_data):
    """Display movements in a readable format."""
    if not movements_data:
        print("No movements data to display")
        return

    movements = movements_data if isinstance(movements_data, list) else movements_data.get('data', [])

    print("\n" + "="*80)
    print(f"Found {len(movements)} movements:")
    print("="*80)

    for movement in movements:
        amount = movement.get('amount', 0)  # Convert from cents to currency
        description = movement.get('description', 'N/A')
        post_date = movement.get('post_date', 'N/A')
        status = movement.get('status', 'N/A')
        movement_type = movement.get('type', 'N/A')

        print(f"\nDate: {post_date}")
        print(f"Amount: ${amount:,.0f}")
        print(f"Description: {description}")
        print(f"Type: {movement_type}")
        print(f"Status: {status}")
        print("-" * 80)


def main():
    # Validate configuration
    if not FINTOC_SECRET_KEY or FINTOC_SECRET_KEY == 'your_fintoc_secret_key_here':
        print("ERROR: Please set FINTOC_SECRET_KEY in your .env file")
        return

    if LINK_TOKEN == 'your_link_token_here':
        print("ERROR: Please set your LINK_TOKEN in this script")
        print("You can get it from: https://app.fintoc.com")
        return

    # Step 1: Fetch all accounts
    accounts_data = fetch_accounts(LINK_TOKEN)

    if not accounts_data:
        return

    accounts = accounts_data if isinstance(accounts_data, list) else accounts_data.get('data', [])

    print(f"\nFound {len(accounts)} account(s):")
    for i, account in enumerate(accounts, 1):
        account_id = account.get('id')
        account_name = account.get('name', 'Unknown')
        account_number = account.get('number', 'N/A')
        balance = account.get('balance', {}).get('available', 0) / 100

        print(f"\n{i}. Account: {account_name}")
        print(f"   ID: {account_id}")
        print(f"   Number: {account_number}")
        print(f"   Balance: ${balance:,.2f}")

    # Step 2: Fetch movements for the first account
    if accounts:
        first_account_id = accounts[0].get('id')
        movements_data = fetch_movements(first_account_id, LINK_TOKEN)

        if movements_data:
            display_movements(movements_data)
    else:
        print("No accounts found")


if __name__ == '__main__':
    main()
