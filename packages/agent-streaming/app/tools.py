"""
Shared tools configuration for Claude Agent SDK.
Contains all tool definitions and MCP server setup for financial assistant.
"""

import math
import json
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import text
from pydantic import BaseModel, Field, field_validator, ConfigDict, ValidationError

from app.db import SessionLocal

from claude_agent_sdk import (
    tool,
    create_sdk_mcp_server,
)


# ============================================================
# Pydantic Input Validation Models
# ============================================================

class CalculateInput(BaseModel):
    """Validation for calculate tool inputs."""
    model_config = ConfigDict(extra="allow")

    expression: str = Field(..., description="Mathematical expression to evaluate")
    precision: Optional[int] = Field(default=2, ge=0, le=10, description="Decimal precision (0-10)")


class CompoundInterestInput(BaseModel):
    """Validation for compound_interest tool inputs."""
    model_config = ConfigDict(extra="allow")

    principal: float = Field(..., gt=0, description="Initial investment amount")
    rate: float = Field(..., gt=0, lt=1, description="Annual interest rate (0-1, e.g., 0.05 for 5%)")
    time: float = Field(..., gt=0, description="Time period in years")
    n: Optional[int] = Field(default=12, gt=0, description="Compounding frequency per year")


class GetAccountsInput(BaseModel):
    """Validation for get_accounts tool inputs."""
    model_config = ConfigDict(extra="allow")


class ListMovementsInput(BaseModel):
    """Validation for list_movements tool inputs."""
    model_config = ConfigDict(extra="allow")

    since: Optional[str] = Field(default=None, description="Start date in ISO 8601 format (YYYY-MM-DD)")
    until: Optional[str] = Field(default=None, description="End date in ISO 8601 format (YYYY-MM-DD)")
    search_term: Optional[str] = Field(default=None, description="Filter by description")
    per_page: Optional[int] = Field(default=30, ge=1, le=100, description="Results per page (1-100)")
    page: Optional[int] = Field(default=1, ge=1, description="Page number (starting from 1)")
    confirmed_only: Optional[bool] = Field(default=True, description="Show only confirmed movements")

    @field_validator('since', 'until')
    @classmethod
    def validate_iso_date(cls, v: Optional[str]) -> Optional[str]:
        """Validate ISO 8601 date format."""
        if v is None:
            return v
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError(f"Date must be in ISO 8601 format (YYYY-MM-DD), got: {v}")


class AggregateByDescriptionInput(BaseModel):
    """Validation for aggregate_by_description tool inputs."""
    model_config = ConfigDict(extra="allow")

    since: Optional[str] = Field(default=None, description="Start date in ISO 8601 format (YYYY-MM-DD)")
    until: Optional[str] = Field(default=None, description="End date in ISO 8601 format (YYYY-MM-DD)")
    confirmed_only: Optional[bool] = Field(default=True, description="Show only confirmed movements")
    min_count: Optional[int] = Field(default=1, ge=1, description="Minimum occurrences to show")
    limit: Optional[int] = Field(default=50, ge=1, le=200, description="Maximum results (1-200)")

    @field_validator('since', 'until')
    @classmethod
    def validate_iso_date(cls, v: Optional[str]) -> Optional[str]:
        """Validate ISO 8601 date format."""
        if v is None:
            return v
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError(f"Date must be in ISO 8601 format (YYYY-MM-DD), got: {v}")


class AggregateTransfersByHolderInput(BaseModel):
    """Validation for aggregate_transfers_by_holder tool inputs."""
    model_config = ConfigDict(extra="allow")

    since: Optional[str] = Field(default=None, description="Start date in ISO 8601 format (YYYY-MM-DD)")
    until: Optional[str] = Field(default=None, description="End date in ISO 8601 format (YYYY-MM-DD)")
    confirmed_only: Optional[bool] = Field(default=True, description="Show only confirmed movements")
    min_count: Optional[int] = Field(default=1, ge=1, description="Minimum occurrences to show")
    limit: Optional[int] = Field(default=50, ge=1, le=200, description="Maximum results (1-200)")

    @field_validator('since', 'until')
    @classmethod
    def validate_iso_date(cls, v: Optional[str]) -> Optional[str]:
        """Validate ISO 8601 date format."""
        if v is None:
            return v
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError(f"Date must be in ISO 8601 format (YYYY-MM-DD), got: {v}")


class SummaryCashflowInput(BaseModel):
    """Validation for summary_cashflow tool inputs."""
    model_config = ConfigDict(extra="allow")

    since: Optional[str] = Field(default=None, description="Start date in ISO 8601 format (YYYY-MM-DD)")
    until: Optional[str] = Field(default=None, description="End date in ISO 8601 format (YYYY-MM-DD)")
    confirmed_only: Optional[bool] = Field(default=True, description="Show only confirmed movements")

    @field_validator('since', 'until')
    @classmethod
    def validate_iso_date(cls, v: Optional[str]) -> Optional[str]:
        """Validate ISO 8601 date format."""
        if v is None:
            return v
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError(f"Date must be in ISO 8601 format (YYYY-MM-DD), got: {v}")


class ExecuteQueryInput(BaseModel):
    """Validation for execute_query tool inputs."""
    model_config = ConfigDict(extra="allow")

    query: str = Field(..., min_length=1, description="SQL SELECT query to execute")


class GetMovementsSchemaInput(BaseModel):
    """Validation for get_movements_schema tool inputs."""
    model_config = ConfigDict(extra="allow")


class GetDateInput(BaseModel):
    """Validation for get_date tool inputs."""
    model_config = ConfigDict(extra="allow")


# ============================================================
# Tool Definitions
# ============================================================

@tool(
    "calculate",
    "Perform mathematical calculations",
    {"expression": str, "precision": int},
)
async def calculate(args: dict[str, Any]) -> dict[str, Any]:
    try:
        # Validate inputs
        validated = CalculateInput.model_validate(args)

        # Use a safe math evaluation library in production
        result = eval(validated.expression, {"__builtins__": {}})
        formatted = round(result, validated.precision)

        return {
            "content": [{"type": "text", "text": f"{validated.expression} = {formatted}"}]
        }
    except ValidationError as e:
        return {
            "content": [
                {"type": "text", "text": f"Validation Error: {str(e)}"}
            ]
        }
    except Exception as e:
        return {
            "content": [
                {"type": "text", "text": f"Error: Invalid expression - {str(e)}"}
            ]
        }


@tool(
    "compound_interest",
    "Calculate compound interest for an investment",
    {"principal": float, "rate": float, "time": float, "n": int},
)
async def compound_interest(args: dict[str, Any]) -> dict[str, Any]:
    try:
        # Validate inputs
        validated = CompoundInterestInput.model_validate(args)

        amount = validated.principal * (1 + validated.rate / validated.n) ** (validated.n * validated.time)
        interest = amount - validated.principal

        return {
            "content": [
                {
                    "type": "text",
                    "text": f"""Investment Analysis:
Principal: ${validated.principal:.2f}
Rate: {validated.rate * 100:.2f}%
Time: {validated.time} years
Compounding: {validated.n} times per year

Final Amount: ${amount:.2f}
Interest Earned: ${interest:.2f}
Return: {(interest / validated.principal) * 100:.2f}%""",
                }
            ]
        }
    except ValidationError as e:
        return {
            "content": [
                {"type": "text", "text": f"Validation Error: {str(e)}"}
            ]
        }


@tool(
    "get_accounts",
    "Get current balances for all connected bank accounts",
    {},
)
async def get_accounts(args: dict[str, Any]) -> dict[str, Any]:
    """
    Retrieve the latest balance information for all accounts.
    """
    try:
        # Validate inputs (no parameters, but ensures structure)
        GetAccountsInput.model_validate(args)
    except ValidationError as e:
        return {
            "content": [
                {"type": "text", "text": f"Validation Error: {str(e)}"}
            ]
        }

    session = SessionLocal()
    try:
        query = """
        SELECT 
            name, 
            official_name, 
            account_type, 
            currency, 
            balance_available, 
            balance_current,
            updated_at
        FROM fintoc_accounts
        ORDER BY balance_current DESC
        """
        result = session.execute(text(query))
        accounts = [dict(row._mapping) for row in result]

        if not accounts:
            return {"content": [{"type": "text", "text": "No accounts found."}]}

        text_output = "Current Account Balances:\n\n"
        total_balance = 0

        for acc in accounts:
            name = acc.get("name") or acc.get("official_name") or "Unknown Account"
            currency = acc.get("currency", "CLP")
            balance = acc.get("balance_current") or 0
            total_balance += float(balance)

            text_output += f"🏦 {name} ({acc.get('account_type', 'N/A')})\n"
            text_output += f"   Balance: ${balance:,.0f} {currency}\n"
            if acc.get("balance_available"):
                text_output += (
                    f"   Available: ${acc['balance_available']:,.0f} {currency}\n"
                )
            text_output += "\n"

        text_output += f"Total Net Worth: ${total_balance:,.0f}"

        return {"content": [{"type": "text", "text": text_output}]}
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error fetching accounts: {str(e)}"}]
        }
    finally:
        session.close()


@tool(
    "list_movements",
    "Retrieve movements of a bank account from the database",
    {
        "since": str,  # ISO 8601 date format
        "until": str,  # ISO 8601 date format
        "search_term": str,  # Filter by description
        "per_page": int,
        "page": int,
        "confirmed_only": bool,
    },
)
async def list_movements(args: dict[str, Any]) -> dict[str, Any]:
    """
    List movements from all bank accounts for the logged-in user.

    Args:
        since: Date using ISO 8601. Return only movements with transaction_date equal or after since (optional)
        until: Date using ISO 8601. Return only movements with transaction_date equal or before until (optional)
        search_term: Filter by description (e.g. "Uber", "Amazon") (optional)
        per_page: Amount of movements per page. Defaults to 30. Maximum is 100 (optional)
        page: The page being retrieved. Starts from 1 (optional)
        confirmed_only: Show only confirmed movements. Defaults to true (optional)
    """
    try:
        # Validate inputs
        validated = ListMovementsInput.model_validate(args)
    except ValidationError as e:
        return {
            "content": [
                {"type": "text", "text": f"Validation Error: {str(e)}"}
            ]
        }

    session = SessionLocal()
    try:
        since = validated.since
        until = validated.until
        search_term = validated.search_term
        per_page = validated.per_page
        page = validated.page
        confirmed_only = validated.confirmed_only

        print(f"Fetching movements from DB for all accounts")
        print(
            f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}, search_term={search_term}"
        )
        print(f"Pagination: page={page}, per_page={per_page}")

        # Build Query
        query_parts = ["SELECT * FROM movements WHERE 1=1"]
        params = {}

        if search_term:
            query_parts.append("AND description ILIKE :search_term")
            params["search_term"] = f"%{search_term}%"

        if since:
            query_parts.append("AND transaction_date >= :since")
            params["since"] = since

        if until:
            query_parts.append("AND transaction_date <= :until")
            params["until"] = until

        if confirmed_only:
            query_parts.append("AND pending = false")

        # Count total matching (before pagination)
        count_query = "SELECT COUNT(*) FROM movements WHERE 1=1 " + " ".join(
            query_parts[1:]
        )
        total_filtered = session.execute(text(count_query), params).scalar()

        # Add sorting and pagination
        query_parts.append("ORDER BY transaction_date DESC")

        offset = (page - 1) * per_page
        query_parts.append("LIMIT :limit OFFSET :offset")
        params["limit"] = per_page
        params["offset"] = offset

        final_query = " ".join(query_parts)
        result = session.execute(text(final_query), params)

        # Convert rows to dicts
        movements = [dict(row._mapping) for row in result]

        total_movements = len(movements)
        result_text = f"Found {total_filtered} movement(s) across all accounts (showing {total_movements} on page {page})\n\n"

        if movements:
            for i, movement in enumerate(movements, 1):
                result_text += f"Movement {i}:\n"
                result_text += f"  ID: {movement.get('id', 'N/A')}\n"
                result_text += f"  Account ID: {movement.get('account_id', 'N/A')}\n"
                result_text += f"  Amount: {movement.get('amount', 'N/A')}\n"
                result_text += f"  Currency: {movement.get('currency', 'N/A')}\n"
                result_text += f"  Description: {movement.get('description', 'N/A')}\n"
                result_text += (
                    f"  Transaction Date: {movement.get('transaction_date', 'N/A')}\n"
                )
                result_text += f"  Status: {movement.get('status', 'N/A')}\n"
                result_text += "\n"
        else:
            result_text += "No movements found for the specified criteria.\n"

        return {"content": [{"type": "text", "text": result_text}]}

    except Exception as e:
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error retrieving movements from DB: {str(e)}",
                }
            ]
        }
    finally:
        session.close()


@tool(
    "aggregate_by_description",
    "Aggregate and group movements by description to analyze spending patterns",
    {
        "since": str,  # ISO 8601 date format
        "until": str,  # ISO 8601 date format
        "confirmed_only": bool,
        "min_count": int,  # Minimum number of occurrences to show
        "limit": int,  # Optional limit on results
    },
)
async def aggregate_by_description(args: dict[str, Any]) -> dict[str, Any]:
    """
    Aggregate movements by their description to show spending patterns.

    Args:
        since: Date using ISO 8601. Return only movements with transaction_date equal or after since (optional)
        until: Date using ISO 8601. Return only movements with transaction_date equal or before until (optional)
        confirmed_only: Show only confirmed movements. Defaults to true (optional)
        min_count: Only show descriptions that appear at least this many times. Defaults to 1 (optional)
        limit: Maximum number of results to return. Defaults to 50, max 200 (optional)
    """
    try:
        # Validate inputs
        validated = AggregateByDescriptionInput.model_validate(args)
    except ValidationError as e:
        return {
            "content": [
                {"type": "text", "text": f"Validation Error: {str(e)}"}
            ]
        }

    session = SessionLocal()
    try:
        since = validated.since
        until = validated.until
        confirmed_only = validated.confirmed_only
        min_count = validated.min_count
        limit = validated.limit

        print(f"Aggregating movements by description")
        print(f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}")

        # Build Query
        query_parts = [
            """
            SELECT 
                description, 
                COUNT(*) as count, 
                SUM(amount) as total_amount, 
                currency
            FROM movements 
            WHERE 1=1
            """
        ]
        params = {}

        if since:
            query_parts.append("AND transaction_date >= :since")
            params["since"] = since

        if until:
            query_parts.append("AND transaction_date <= :until")
            params["until"] = until

        if confirmed_only:
            query_parts.append("AND pending = false")

        query_parts.append("GROUP BY description, currency")

        if min_count > 1:
            query_parts.append("HAVING COUNT(*) >= :min_count")
            params["min_count"] = min_count

        query_parts.append("ORDER BY ABS(SUM(amount)) DESC")
        query_parts.append("LIMIT :limit")
        params["limit"] = limit

        final_query = " ".join(query_parts)
        result = session.execute(text(final_query), params)

        sorted_aggregations = [dict(row._mapping) for row in result]

        # Format result
        total_movements_count = sum(a["count"] for a in sorted_aggregations)
        result_text = f"Found {len(sorted_aggregations)} unique description(s) with {total_movements_count} total movements\n\n"

        if sorted_aggregations:
            for i, data in enumerate(sorted_aggregations, 1):
                description = data.get("description", "Unknown")
                count = data["count"]
                total = data["total_amount"]
                currency = data["currency"]
                avg = total / count if count > 0 else 0

                result_text += f"{i}. {description}\n"
                result_text += f"   Count: {count} transaction(s)\n"
                result_text += f"   Total: {total:,.0f} {currency}\n"
                result_text += f"   Average: {avg:,.0f} {currency}\n"
                result_text += "\n"
        else:
            result_text += "No movements found for the specified criteria.\n"

        return {"content": [{"type": "text", "text": result_text}]}

    except Exception as e:
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error aggregating movements: {str(e)}",
                }
            ]
        }
    finally:
        session.close()


@tool(
    "aggregate_transfers_by_holder",
    "Aggregate transfer movements by recipient/sender holder name to analyze transfer patterns",
    {
        "since": str,  # ISO 8601 date format
        "until": str,  # ISO 8601 date format
        "confirmed_only": bool,
        "min_count": int,  # Minimum number of occurrences to show
        "limit": int,  # Optional limit on results
    },
)
async def aggregate_transfers_by_holder(args: dict[str, Any]) -> dict[str, Any]:
    """
    Aggregate transfer movements by the holder name to show transfer patterns.

    Args:
        since: Date using ISO 8601. Return only movements with transaction_date equal or after since (optional)
        until: Date using ISO 8601. Return only movements with transaction_date equal or before until (optional)
        confirmed_only: Show only confirmed movements. Defaults to true (optional)
        min_count: Only show holders that appear at least this many times. Defaults to 1 (optional)
        limit: Maximum number of results to return. Defaults to 50, max 200 (optional)
    """
    try:
        # Validate inputs
        validated = AggregateTransfersByHolderInput.model_validate(args)
    except ValidationError as e:
        return {
            "content": [
                {"type": "text", "text": f"Validation Error: {str(e)}"}
            ]
        }

    session = SessionLocal()
    try:
        since = validated.since
        until = validated.until
        confirmed_only = validated.confirmed_only
        min_count = validated.min_count
        limit = validated.limit

        print(f"Aggregating transfers by holder name")
        print(f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}")

        # Build Query
        query_parts = [
            """
            SELECT 
                c.holder_name,
                COUNT(*) as count,
                SUM(m.amount) as total_amount,
                m.currency
            FROM movements m
            JOIN counterparties c ON m.counterparty_id = c.id
            WHERE 1=1
            """
        ]
        # We assume 'transfer' type check might be needed,
        # but init.sql doesn't strictly enforce movement_type enum.
        # Based on previous python code: if m.get("type") == "transfer"
        # Let's check if we should add that filter.
        query_parts.append("AND m.movement_type = 'transfer'")

        params = {}

        if since:
            query_parts.append("AND m.transaction_date >= :since")
            params["since"] = since

        if until:
            query_parts.append("AND m.transaction_date <= :until")
            params["until"] = until

        if confirmed_only:
            query_parts.append("AND m.pending = false")

        query_parts.append("GROUP BY c.holder_name, m.currency")

        if min_count > 1:
            query_parts.append("HAVING COUNT(*) >= :min_count")
            params["min_count"] = min_count

        query_parts.append("ORDER BY ABS(SUM(m.amount)) DESC")
        query_parts.append("LIMIT :limit")
        params["limit"] = limit

        final_query = " ".join(query_parts)
        result = session.execute(text(final_query), params)

        sorted_aggregations = [dict(row._mapping) for row in result]

        # Format result
        total_transfers_count = sum(a["count"] for a in sorted_aggregations)
        result_text = f"Found {len(sorted_aggregations)} unique holder(s) with {total_transfers_count} total transfers\n\n"

        if sorted_aggregations:
            for i, data in enumerate(sorted_aggregations, 1):
                holder_name = data.get("holder_name", "Unknown")
                count = data["count"]
                total = data["total_amount"]
                currency = data["currency"]
                avg = total / count if count > 0 else 0

                result_text += f"{i}. {holder_name}\n"
                result_text += f"   Count: {count} transfer(s)\n"
                result_text += f"   Total: {total:,.0f} {currency}\n"
                result_text += f"   Average: {avg:,.0f} {currency}\n"
                result_text += "\n"
        else:
            result_text += "No transfers found for the specified criteria.\n"

        return {"content": [{"type": "text", "text": result_text}]}

    except Exception as e:
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error aggregating transfers: {str(e)}",
                }
            ]
        }
    finally:
        session.close()


@tool(
    "summary_cashflow",
    "Get total income, expenses and net cashflow in a given period",
    {
        "since": str,
        "until": str,
        "confirmed_only": bool,
    },
)
async def summary_cashflow(args: dict[str, Any]) -> dict[str, Any]:
    try:
        # Validate inputs
        validated = SummaryCashflowInput.model_validate(args)
    except ValidationError as e:
        return {
            "content": [
                {"type": "text", "text": f"Validation Error: {str(e)}"}
            ]
        }

    session = SessionLocal()
    try:
        since = validated.since
        until = validated.until
        confirmed_only = validated.confirmed_only

        query_parts = [
            """
            SELECT 
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) AS total_expenses,
                COALESCE(MAX(currency), 'CLP') as currency,
                COUNT(*) as count
            FROM movements
            WHERE 1=1
            """
        ]
        params = {}

        if since:
            query_parts.append("AND transaction_date >= :since")
            params["since"] = since
        if until:
            query_parts.append("AND transaction_date <= :until")
            params["until"] = until
        if confirmed_only:
            query_parts.append("AND pending = false")

        # Removed GROUP BY since we assume a single currency environment (CLP)
        # This avoids potential issues with fetchone() dropping data if multiple currencies existed

        final_query = " ".join(query_parts)
        row = session.execute(text(final_query), params).fetchone()

        data = dict(row._mapping)

        if data["count"] == 0:
            return {
                "content": [
                    {
                        "type": "text",
                        "text": "No se encontraron movimientos para ese período.",
                    }
                ]
            }

        income = data["total_income"]
        expenses = data["total_expenses"]  # negative
        net = income + expenses

        text_summary = (
            f"Resumen de flujo de caja ({data['currency']}):\n"
            f"- Ingresos: {income:,.0f}\n"
            f"- Gastos: {abs(expenses):,.0f}\n"
            f"- Neto: {net:,.0f}\n"
        )

        return {
            "content": [
                {"type": "text", "text": text_summary},
                {
                    "type": "json",
                    "json": {
                        "income": income,
                        "expenses": expenses,
                        "net": net,
                        "currency": data["currency"],
                    },
                },
            ]
        }
    finally:
        session.close()


@tool(
    "execute_query",
    "Execute a read-only SQL SELECT query against the database",
    {"query": str},
)
async def execute_query(args: dict[str, Any]) -> dict[str, Any]:
    """
    Execute a read-only SQL SELECT query against the database.
    Only SELECT queries are allowed. Data modification queries (INSERT, UPDATE, DELETE, etc.) are not permitted.
    """
    try:
        # Validate inputs
        validated = ExecuteQueryInput.model_validate(args)
    except ValidationError as e:
        return {
            "content": [
                {"type": "text", "text": f"Validation Error: {str(e)}"}
            ]
        }

    session = SessionLocal()
    try:
        query = validated.query
        print(f"\n{'='*60}")
        print(f"[{datetime.now().isoformat()}] Starting query execution")
        print(f"Query preview: {query[:200]}...")
        print(f"{'='*60}\n")

        # Strip whitespace and check if query starts with SELECT (case-insensitive)
        query_stripped = query.strip()
        if not query_stripped.upper().startswith("SELECT"):
            return {
                "content": [
                    {
                        "type": "text",
                        "text": "Error: Only SELECT queries are allowed. This tool is read-only and does not permit data modification (INSERT, UPDATE, DELETE, DROP, etc.).",
                    }
                ]
            }

        # Time the database execution
        db_start = datetime.now()
        print(f"[{db_start.isoformat()}] 🔄 Executing DB query...")
        result = session.execute(text(query))
        db_end = datetime.now()
        db_elapsed = (db_end - db_start).total_seconds()
        print(f"[{db_end.isoformat()}] ✅ DB query completed in {db_elapsed:.2f}s")

        # Since we only allow SELECT queries, result should always return rows
        if result.returns_rows:
            # Time the row fetching
            fetch_start = datetime.now()
            print(f"[{fetch_start.isoformat()}] 📦 Fetching rows...")
            rows = [dict(row._mapping) for row in result]
            fetch_end = datetime.now()
            fetch_elapsed = (fetch_end - fetch_start).total_seconds()
            print(
                f"[{fetch_end.isoformat()}] ✅ Fetched {len(rows)} rows in {fetch_elapsed:.2f}s"
            )

            # Time the JSON serialization
            json_start = datetime.now()
            print(f"[{json_start.isoformat()}] 🔄 Serializing to JSON...")
            json_result = json.dumps(rows, default=str, indent=2)
            json_end = datetime.now()
            json_elapsed = (json_end - json_start).total_seconds()
            print(
                f"[{json_end.isoformat()}] ✅ Serialized {len(json_result)} chars in {json_elapsed:.2f}s"
            )

            total_elapsed = (json_end - db_start).total_seconds()
            print(f"\n{'='*60}")
            print(f"⏱️  TOTAL TIME: {total_elapsed:.2f}s")
            print(
                f"   - DB execution: {db_elapsed:.2f}s ({db_elapsed/total_elapsed*100:.1f}%)"
            )
            print(
                f"   - Row fetching: {fetch_elapsed:.2f}s ({fetch_elapsed/total_elapsed*100:.1f}%)"
            )
            print(
                f"   - JSON serialization: {json_elapsed:.2f}s ({json_elapsed/total_elapsed*100:.1f}%)"
            )
            print(f"{'='*60}\n")

            return {"content": [{"type": "text", "text": json_result}]}
        else:
            return {
                "content": [
                    {
                        "type": "text",
                        "text": "Query executed successfully, but no rows were returned.",
                    }
                ]
            }
    except Exception as e:
        error_time = datetime.now()
        print(f"[{error_time.isoformat()}] ❌ Error: {str(e)}")
        return {
            "content": [{"type": "text", "text": f"Error executing query: {str(e)} "}]
        }
    finally:
        session.close()


@tool(
    "get_movements_schema",
    "Get the schema definition of the movements table",
    {},
)
async def get_movements_schema(args: dict[str, Any]) -> dict[str, Any]:
    """
    Get the column definitions for the movements table to understand the data structure.
    """
    try:
        # Validate inputs (no parameters, but ensures structure)
        GetMovementsSchemaInput.model_validate(args)
    except ValidationError as e:
        return {
            "content": [
                {"type": "text", "text": f"Validation Error: {str(e)}"}
            ]
        }

    session = SessionLocal()
    try:
        # Query information_schema for columns
        query = """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'movements'
        ORDER BY ordinal_position;
        """
        result = session.execute(text(query))
        columns = [dict(row._mapping) for row in result]

        formatted_schema = "Table: movements\n\n"
        if columns:
            for col in columns:
                formatted_schema += f"- {col['column_name']} ({col['data_type']})"
                if col["is_nullable"] == "NO":
                    formatted_schema += " NOT NULL"
                formatted_schema += "\n"
        else:
            formatted_schema += "No columns found or table does not exist."

        return {"content": [{"type": "text", "text": formatted_schema}]}
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error getting schema: {str(e)}"}]
        }
    finally:
        session.close()


@tool(
    "get_date",
    "Get the current date and time in ISO 8601 format",
    {},
)
async def get_date(args: dict[str, Any]) -> dict[str, Any]:
    """
    Get the current date and time in ISO 8601 format.
    Returns the current date and time which should be used for any date-based calculations.
    """
    try:
        # Validate inputs (no parameters, but ensures structure)
        GetDateInput.model_validate(args)
    except ValidationError as e:
        return {
            "content": [
                {"type": "text", "text": f"Validation Error: {str(e)}"}
            ]
        }

    now = datetime.now()
    iso_date = now.strftime("%Y-%m-%d")
    iso_datetime = now.strftime("%Y-%m-%dT%H:%M:%S")

    print(
        f"Current date: {iso_date}\nCurrent datetime: {iso_datetime}\nISO format for queries: {iso_date}"
    )

    return {
        "content": [
            {
                "type": "text",
                "text": f"Current date: {iso_date}\nCurrent datetime: {iso_datetime}\nISO format for queries: {iso_date}",
            }
        ]
    }


# Create SDK MCP server config for tools (in-process, not a separate MCP server)
lucas_tools = create_sdk_mcp_server(
    name="lucas_tools",
    version="1.0.0",
    tools=[
        calculate,
        compound_interest,
        get_accounts,
        list_movements,
        aggregate_by_description,
        aggregate_transfers_by_holder,
        summary_cashflow,
        get_date,
        execute_query,
        get_movements_schema,
    ],
)


# System prompt for financial assistant
SYSTEM_PROMPT = """Eres un contador de finanzas personales especializado en análisis de gastos.

IMPORTANTE - FLUJO OBLIGATORIO:
1. SIEMPRE debes usar la herramienta get_date PRIMERO antes de cualquier consulta sobre fechas o movimientos
2. Usa la fecha actual obtenida para calcular rangos de fechas correctamente
3. Para consultar saldos, usa get_accounts.
4. Luego usa list_movements con las fechas en formato ISO 8601 (YYYY-MM-DD). Puedes filtrar por descripción con search_term.
5. Para análisis de patrones de gasto, usa aggregate_by_description para agrupar gastos por descripción
6. Para análisis de transferencias, usa aggregate_transfers_by_holder para ver a quién transfieres
7. Para obtener un resumen general de flujo de caja (ingresos vs gastos), usa summary_cashflow
8. Si necesitas información más específica que no cubren las herramientas anteriores, puedes usar execute_query para consultas SQL directas, pero ten cuidado de escribir SQL válido.
9. Si no conoces la estructura de la tabla movements, usa get_movements_schema.

Cuando el usuario pregunte sobre períodos relativos como "la semana pasada", "este mes", etc:
- PRIMERO llama a get_date para obtener la fecha actual
- DESPUÉS calcula las fechas de inicio y fin basándote en la fecha actual obtenida
- Finalmente consulta los movimientos con list_movements o las herramientas de agregación

Herramientas disponibles:
- get_accounts: Obtiene los saldos actuales de las cuentas
- list_movements: Lista movimientos individuales de todas las cuentas (con filtro opcional de búsqueda)
- aggregate_by_description: Agrupa y suma movimientos por descripción para ver patrones de gasto
- aggregate_transfers_by_holder: Agrupa transferencias por el nombre del beneficiario/remitente
- summary_cashflow: Obtiene ingresos, gastos y flujo neto en un período
- get_date: Obtiene la fecha actual
- calculate: Realiza cálculos matemáticos
- compound_interest: Calcula interés compuesto
- execute_query: Ejecuta una consulta SQL arbitraria (SOLO si es necesario)
- get_movements_schema: Obtiene la estructura de la tabla movements

Tu objetivo es ayudar a los usuarios a entender su estado financiero y a tomar decisiones informadas sobre su dinero.
"""


# Allowed tools list for agent options
ALLOWED_TOOLS = [
    "mcp__Tools__get_date",
    "mcp__Tools__get_accounts",
    "mcp__Tools__list_movements",
    "mcp__Tools__aggregate_by_description",
    "mcp__Tools__aggregate_transfers_by_holder",
    "mcp__Tools__summary_cashflow",
    "mcp__Tools__calculate",
    "mcp__Tools__compound_interest",
    "mcp__Tools__execute_query",
    "mcp__Tools__get_movements_schema",
]
