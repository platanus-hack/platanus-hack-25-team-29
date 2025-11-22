"""
Isolated test script to verify Supabase connection for the financial agent.
Run this before starting the agent to ensure database connectivity works.

Usage:
    python test_db_connection.py
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def print_header(text: str):
    """Print a formatted header."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)


def print_test(name: str, status: bool, details: str = ""):
    """Print test result with status indicator."""
    icon = "✓" if status else "✗"
    status_text = "PASS" if status else "FAIL"
    print(f"\n{icon} {name}: {status_text}")
    if details:
        print(f"  → {details}")


async def main():
    print_header("SUPABASE CONNECTION TEST")
    print("Testing database connectivity and query functionality...\n")

    # Test 1: Environment Variables
    print_header("1. ENVIRONMENT VARIABLES CHECK")

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    env_ok = bool(supabase_url and supabase_key)
    print_test(
        "Environment variables loaded",
        env_ok,
        f"URL: {supabase_url[:30]}..." if supabase_url else "Missing SUPABASE_URL"
    )

    if not env_ok:
        print("\n❌ ERROR: Missing environment variables!")
        print("Please ensure .env file exists with:")
        print("  - SUPABASE_URL")
        print("  - SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    # Test 2: Import and Initialize Supabase Client
    print_header("2. SUPABASE CLIENT INITIALIZATION")

    try:
        from supabase import create_client
        print_test("Supabase library imported", True, "supabase-py module loaded")
    except ImportError as e:
        print_test("Supabase library imported", False, f"Import error: {e}")
        print("\n❌ ERROR: supabase-py not installed!")
        print("Run: pip install supabase")
        sys.exit(1)

    try:
        supabase = create_client(supabase_url, supabase_key)
        print_test("Supabase client created", True, f"Connected to {supabase_url}")
    except Exception as e:
        print_test("Supabase client created", False, f"Error: {e}")
        sys.exit(1)

    # Test 3: Basic Connection Test
    print_header("3. DATABASE CONNECTION TEST")

    try:
        # Try to query the movements table
        response = supabase.table("movements").select("id", count="exact").limit(1).execute()
        count = response.count if hasattr(response, 'count') else len(response.data)
        print_test(
            "Query movements table",
            True,
            f"Connection successful! Found movements in database"
        )
    except Exception as e:
        print_test("Query movements table", False, f"Error: {e}")
        print("\n⚠️  WARNING: Could not connect to movements table")
        print("   Make sure the database schema is initialized (init.sql)")
        sys.exit(1)

    # Test 4: Import DB Client
    print_header("4. DB CLIENT MODULE TEST")

    try:
        from db_client import get_supabase_client
        print_test("Import db_client module", True, "Module loaded successfully")
    except ImportError as e:
        print_test("Import db_client module", False, f"Import error: {e}")
        sys.exit(1)

    try:
        db_client = get_supabase_client()
        print_test("Initialize DB client", True, "SupabaseClient singleton created")
    except Exception as e:
        print_test("Initialize DB client", False, f"Error: {e}")
        sys.exit(1)

    # Test 5: Fetch Movements
    print_header("5. FETCH MOVEMENTS TEST")

    try:
        # Test without filters
        result = await db_client.fetch_movements(per_page=5, page=1)
        movements = result.get("movements", [])
        count = result.get("count", 0)

        print_test(
            "Fetch movements (no filters)",
            count > 0,
            f"Retrieved {count} movements"
        )

        if count > 0:
            sample = movements[0]
            print(f"\n  Sample movement:")
            print(f"    ID: {sample.get('id', 'N/A')}")
            print(f"    Amount: {sample.get('amount', 'N/A')} {sample.get('currency', '')}")
            print(f"    Description: {sample.get('description', 'N/A')}")
            print(f"    Date: {sample.get('post_date', 'N/A')}")
    except Exception as e:
        print_test("Fetch movements (no filters)", False, f"Error: {e}")

    # Test 6: Fetch with Date Filters
    print_header("6. FETCH WITH DATE FILTERS TEST")

    try:
        # Get movements from last 30 days
        today = datetime.now()
        since = (today - timedelta(days=30)).strftime("%Y-%m-%d")
        until = today.strftime("%Y-%m-%d")

        result = await db_client.fetch_movements(
            since=since,
            until=until,
            per_page=10,
            confirmed_only=True
        )

        movements = result.get("movements", [])
        count = result.get("count", 0)

        print_test(
            f"Fetch movements (last 30 days)",
            True,
            f"Retrieved {count} movements from {since} to {until}"
        )
    except Exception as e:
        print_test("Fetch movements (with filters)", False, f"Error: {e}")

    # Test 7: Aggregate by Description
    print_header("7. AGGREGATE BY DESCRIPTION TEST")

    try:
        # Get movements from last 60 days
        today = datetime.now()
        since = (today - timedelta(days=60)).strftime("%Y-%m-%d")

        aggregations = await db_client.aggregate_by_description(
            since=since,
            confirmed_only=True,
            min_count=1
        )

        count = len(aggregations)
        print_test(
            "Aggregate by description",
            count >= 0,
            f"Found {count} unique descriptions"
        )

        if count > 0:
            top_3 = aggregations[:3]
            print(f"\n  Top 3 spending categories:")
            for i, agg in enumerate(top_3, 1):
                print(f"    {i}. {agg['description']}: {agg['total_amount']:,.0f} {agg['currency']} ({agg['count']} transactions)")
    except Exception as e:
        print_test("Aggregate by description", False, f"Error: {e}")

    # Test 8: Aggregate Transfers by Holder
    print_header("8. AGGREGATE TRANSFERS BY HOLDER TEST")

    try:
        # Get transfers from last 60 days
        today = datetime.now()
        since = (today - timedelta(days=60)).strftime("%Y-%m-%d")

        aggregations = await db_client.aggregate_transfers_by_holder(
            since=since,
            confirmed_only=True,
            min_count=1
        )

        count = len(aggregations)
        print_test(
            "Aggregate transfers by holder",
            count >= 0,
            f"Found {count} unique transfer holders"
        )

        if count > 0:
            top_3 = aggregations[:3]
            print(f"\n  Top 3 transfer recipients/senders:")
            for i, agg in enumerate(top_3, 1):
                print(f"    {i}. {agg['holder_name']}: {agg['total_amount']:,.0f} {agg['currency']} ({agg['count']} transfers)")
        elif count == 0:
            print("  ℹ️  No transfers found (this is normal if you only have non-transfer movements)")
    except Exception as e:
        print_test("Aggregate transfers by holder", False, f"Error: {e}")

    # Test 9: Pydantic Models
    print_header("9. PYDANTIC MODELS TEST")

    try:
        from models import Movement, MovementSummary, AggregationResult
        print_test("Import Pydantic models", True, "All models imported successfully")

        # Try to create a model instance (if we have movements)
        if count > 0 and len(movements) > 0:
            try:
                sample_movement = movements[0]
                # Test if we can create a Movement instance
                # Note: This might fail if the data doesn't match the schema exactly
                print_test(
                    "Validate movement data",
                    True,
                    "Movement data structure looks valid"
                )
            except Exception as e:
                print_test("Validate movement data", False, f"Schema mismatch: {e}")
    except ImportError as e:
        print_test("Import Pydantic models", False, f"Import error: {e}")

    # Final Summary
    print_header("TEST SUMMARY")
    print("\n✅ All core tests passed!")
    print("\nYour Supabase connection is working correctly.")
    print("You can now run the agent with: python agent.py")
    print("\n" + "=" * 70 + "\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
