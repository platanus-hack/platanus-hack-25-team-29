"""Supabase database client for agent queries."""

import os
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from models import Movement

# Load environment variables
load_dotenv()


class SupabaseClient:
    """Singleton Supabase client for database operations."""

    _instance: Optional["SupabaseClient"] = None
    _client: Optional[Client] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

            if not supabase_url or not supabase_key:
                raise ValueError(
                    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. "
                    "Please check your .env file."
                )

            self._client = create_client(supabase_url, supabase_key)
            print(f"✓ Supabase client initialized: {supabase_url}")

    @property
    def client(self) -> Client:
        """Get the Supabase client instance."""
        if self._client is None:
            raise RuntimeError("Supabase client not initialized")
        return self._client

    async def fetch_movements(
        self,
        since: Optional[str] = None,
        until: Optional[str] = None,
        per_page: int = 30,
        page: int = 1,
        confirmed_only: bool = True,
    ) -> Dict[str, Any]:
        """
        Fetch movements from the database with filtering and pagination.

        Args:
            since: ISO 8601 date (YYYY-MM-DD). Return movements >= this date
            until: ISO 8601 date (YYYY-MM-DD). Return movements <= this date
            per_page: Number of results per page (max 300)
            page: Page number (starts from 1)
            confirmed_only: If True, exclude pending movements

        Returns:
            Dict with count and movements list
        """
        try:
            # Start with base query - select specific fields to reduce token usage
            query = self.client.table("movements").select(
                "id, account_id, amount, currency, description, post_date, status, pending, movement_type"
            )

            # Apply date filters
            if since:
                query = query.gte("post_date", since)
            if until:
                query = query.lte("post_date", until)

            # Filter confirmed movements
            if confirmed_only:
                query = query.eq("pending", False)

            # Apply ordering (most recent first)
            query = query.order("post_date", desc=True)

            # Apply pagination
            per_page = min(per_page, 300)  # Cap at 300
            start = (page - 1) * per_page
            end = start + per_page - 1
            query = query.range(start, end)

            # Execute query
            response = query.execute()

            return {"count": len(response.data), "movements": response.data}

        except Exception as e:
            print(f"❌ Error fetching movements from Supabase: {str(e)}")
            raise

    async def aggregate_by_description(
        self,
        since: Optional[str] = None,
        until: Optional[str] = None,
        confirmed_only: bool = True,
        min_count: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        Aggregate movements by description to analyze spending patterns.

        Returns list of aggregations sorted by total amount (descending).
        """
        try:
            # Fetch all movements (no pagination for aggregation)
            query = self.client.table("movements").select(
                "description, amount, currency, pending"
            )

            # Apply filters
            if since:
                query = query.gte("post_date", since)
            if until:
                query = query.lte("post_date", until)
            if confirmed_only:
                query = query.eq("pending", False)

            response = query.execute()
            movements = response.data

            # Aggregate in Python (PostgREST doesn't support GROUP BY directly)
            aggregations = {}
            for movement in movements:
                desc = movement.get("description") or "Unknown"
                amount = float(movement.get("amount", 0))
                currency = movement.get("currency", "CLP")

                if desc not in aggregations:
                    aggregations[desc] = {
                        "description": desc,
                        "count": 0,
                        "total_amount": 0.0,
                        "currency": currency,
                    }

                aggregations[desc]["count"] += 1
                aggregations[desc]["total_amount"] += amount

            # Filter by min_count and calculate averages
            result = []
            for desc, data in aggregations.items():
                if data["count"] >= min_count:
                    data["average_amount"] = (
                        data["total_amount"] / data["count"] if data["count"] > 0 else 0
                    )
                    result.append(data)

            # Sort by absolute total amount (descending)
            result.sort(key=lambda x: abs(x["total_amount"]), reverse=True)

            return result

        except Exception as e:
            print(f"❌ Error aggregating movements: {str(e)}")
            raise

    async def aggregate_transfers_by_holder(
        self,
        since: Optional[str] = None,
        until: Optional[str] = None,
        confirmed_only: bool = True,
        min_count: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        Aggregate transfer movements by holder name.

        Note: This requires joining with counterparties table or extracting
        holder info from movement metadata. Currently simplified.
        """
        try:
            # Fetch transfer movements
            query = self.client.table("movements").select(
                "amount, currency, pending, movement_type, counterparty_id"
            )

            # Filter only transfers
            query = query.eq("movement_type", "transfer")

            # Apply filters
            if since:
                query = query.gte("post_date", since)
            if until:
                query = query.lte("post_date", until)
            if confirmed_only:
                query = query.eq("pending", False)

            response = query.execute()
            movements = response.data

            # For now, aggregate by counterparty_id
            # In production, you'd join with counterparties table to get holder_name
            aggregations = {}
            for movement in movements:
                counterparty = movement.get("counterparty_id") or "Unknown"
                amount = float(movement.get("amount", 0))
                currency = movement.get("currency", "CLP")

                if counterparty not in aggregations:
                    aggregations[counterparty] = {
                        "holder_name": counterparty,  # Would be actual name after join
                        "institution": "Unknown",  # Would come from join
                        "transfer_type": "sent to" if amount < 0 else "received from",
                        "count": 0,
                        "total_amount": 0.0,
                        "currency": currency,
                    }

                aggregations[counterparty]["count"] += 1
                aggregations[counterparty]["total_amount"] += amount

            # Filter by min_count and calculate averages
            result = []
            for holder, data in aggregations.items():
                if data["count"] >= min_count:
                    data["average_amount"] = (
                        data["total_amount"] / data["count"] if data["count"] > 0 else 0
                    )
                    result.append(data)

            # Sort by absolute total amount (descending)
            result.sort(key=lambda x: abs(x["total_amount"]), reverse=True)

            return result

        except Exception as e:
            print(f"❌ Error aggregating transfers: {str(e)}")
            raise


# Global client instance
_supabase_client: Optional[SupabaseClient] = None


def get_supabase_client() -> SupabaseClient:
    """Get or create the global Supabase client instance."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client
