"""
Shared tools configuration for Claude Agent SDK.
Contains all tool definitions and MCP server setup for financial assistant.
"""

import math
import json
from datetime import datetime
from typing import Any

from sqlalchemy import text

from app.db import SessionLocal

from claude_agent_sdk import (
    tool,
    create_sdk_mcp_server,
)


@tool(
    "calculate",
    "Perform mathematical calculations",
    {"expression": str, "precision": int},
)
async def calculate(args: dict[str, Any]) -> dict[str, Any]:
    try:
        # Use a safe math evaluation library in production
        result = eval(args["expression"], {"__builtins__": {}})
        precision = args.get("precision", 2)
        formatted = round(result, precision)

        return {
            "content": [{"type": "text", "text": f"{args['expression']} = {formatted}"}]
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
    principal = args["principal"]
    rate = args["rate"]
    time = args["time"]
    n = args.get("n", 12)

    amount = principal * (1 + rate / n) ** (n * time)
    interest = amount - principal

    return {
        "content": [
            {
                "type": "text",
                "text": f"""Investment Analysis:
Principal: ${principal:.2f}
Rate: {rate * 100:.2f}%
Time: {time} years
Compounding: {n} times per year

Final Amount: ${amount:.2f}
Interest Earned: ${interest:.2f}
Return: {(interest / principal) * 100:.2f}%""",
            }
        ]
    }


@tool(
    "list_movements",
    "Retrieve movements of a bank account from the database",
    {
        "since": str,  # ISO 8601 date format
        "until": str,  # ISO 8601 date format
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
        per_page: Amount of movements per page. Defaults to 30. Maximum is 300 (optional)
        page: The page being retrieved. Starts from 1 (optional)
        confirmed_only: Show only confirmed movements. Defaults to true (optional)
    """
    session = SessionLocal()
    try:
        since = args.get("since")
        until = args.get("until")
        per_page = args.get("per_page", 30)
        page = args.get("page", 1)
        confirmed_only = args.get("confirmed_only", True)

        print(f"Fetching movements from DB for all accounts")
        print(f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}")
        print(f"Pagination: page={page}, per_page={per_page}")

        # Build Query
        query_parts = ["SELECT * FROM movements WHERE 1=1"]
        params = {}

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
        limit: Maximum number of results to return. Defaults to 50 (optional)
    """
    session = SessionLocal()
    try:
        since = args.get("since")
        until = args.get("until")
        confirmed_only = args.get("confirmed_only", True)
        min_count = args.get("min_count", 1)
        limit = args.get("limit", 50)

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
        limit: Maximum number of results to return. Defaults to 50 (optional)
    """
    session = SessionLocal()
    try:
        since = args.get("since")
        until = args.get("until")
        confirmed_only = args.get("confirmed_only", True)
        min_count = args.get("min_count", 1)
        limit = args.get("limit", 50)

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

                # Note: Institution and Holder Type (sent/received) logic is harder to replicate purely in SQL
                # without more complex joins or schema knowledge about 'recipient_account' vs 'sender_account'
                # which seems to be part of the JSON structure but flattened in SQL.
                # We will omit detailed institution info for now as it's not in the simple join.

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
    "execute_query",
    "Execute a raw SQL query against the database",
    {"query": str},
)
async def execute_query(args: dict[str, Any]) -> dict[str, Any]:
    """
    Execute a raw SQL query against the database.
    WARNING: This tool allows executing any SQL query. Use with caution.
    """
    session = SessionLocal()
    try:
        query = args["query"]
        print(f"Executing query: {query}")

        result = session.execute(text(query))

        if result.returns_rows:
            rows = [dict(row._mapping) for row in result]
            return {
                "content": [
                    {"type": "text", "text": json.dumps(rows, default=str, indent=2)}
                ]
            }
        else:
            session.commit()
            return {
                "content": [{"type": "text", "text": "Query executed successfully."}]
            }
    except Exception as e:
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
        list_movements,
        aggregate_by_description,
        aggregate_transfers_by_holder,
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
3. Luego usa list_movements con las fechas en formato ISO 8601 (YYYY-MM-DD)
4. Para análisis de patrones de gasto, usa aggregate_by_description para agrupar gastos por descripción
5. Para análisis de transferencias, usa aggregate_transfers_by_holder para ver a quién transfieres
6. Si necesitas información más específica que no cubren las herramientas anteriores, puedes usar execute_query para consultas SQL directas, pero ten cuidado de escribir SQL válido.
7. Si no conoces la estructura de la tabla movements, usa get_movements_schema.

Cuando el usuario pregunte sobre períodos relativos como "la semana pasada", "este mes", etc:
- PRIMERO llama a get_date para obtener la fecha actual
- DESPUÉS calcula las fechas de inicio y fin basándote en la fecha actual obtenida
- Finalmente consulta los movimientos con list_movements o las herramientas de agregación

Herramientas disponibles:
- list_movements: Lista movimientos individuales de todas las cuentas
- aggregate_by_description: Agrupa y suma movimientos por descripción para ver patrones de gasto
- aggregate_transfers_by_holder: Agrupa transferencias por el nombre del beneficiario/remitente
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
    "mcp__Tools__list_movements",
    "mcp__Tools__aggregate_by_description",
    "mcp__Tools__aggregate_transfers_by_holder",
    "mcp__Tools__calculate",
    "mcp__Tools__compound_interest",
    "mcp__Tools__execute_query",
    "mcp__Tools__get_movements_schema",
]
