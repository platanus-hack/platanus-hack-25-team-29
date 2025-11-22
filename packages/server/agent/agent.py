import math
import json
from datetime import datetime
from pathlib import Path
from typing import Any

from claude_agent_sdk import (
    tool,
    create_sdk_mcp_server,
    ClaudeSDKClient,
    ClaudeAgentOptions,
)
from claude_agent_sdk.types import AssistantMessage, TextBlock, ToolUseBlock

# Import Supabase client for database access
from db_client import get_supabase_client


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
        since: Date using ISO 8601. Return only movements with post_date equal or after since (optional)
        until: Date using ISO 8601. Return only movements with post_date equal or before until (optional)
        per_page: Amount of movements per page. Defaults to 30. Maximum is 300 (optional)
        page: The page being retrieved. Starts from 1 (optional)
        confirmed_only: Show only confirmed movements. Defaults to true (optional)
    """
    try:
        # Fetch movements from database (simulated with JSON)
        since = args.get("since")
        until = args.get("until")
        per_page = args.get("per_page", 30)
        page = args.get("page", 1)
        confirmed_only = args.get("confirmed_only", True)

        print(f"Fetching movements from DB for all accounts")
        print(f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}")
        print(f"Pagination: page={page}, per_page={per_page}")

        # Load data from JSON file
        db_path = Path(__file__).parent.parent / "db" / "example_data.json"
        try:
            with open(db_path, "r") as f:
                data = json.load(f)
                all_accounts = data.get("accounts", [])
                all_movements = data.get("movements", [])
        except FileNotFoundError:
            print(f"Database file not found at {db_path}")
            return {
                "content": [{"type": "text", "text": "Error: Database file not found."}]
            }

        # Get all account IDs dynamically
        account_ids = [acc.get("id") for acc in all_accounts if acc.get("id")]
        print(f"Found {len(account_ids)} accounts: {account_ids}")

        # Filter movements from all accounts (no account_id filter needed - aggregate all)
        filtered_movements = all_movements

        # Filter by date (since)
        if since:
            filtered_movements = [
                m
                for m in filtered_movements
                if m.get("post_date") and m.get("post_date", "") >= since
            ]

        # Filter by date (until)
        if until:
            filtered_movements = [
                m
                for m in filtered_movements
                if m.get("post_date") and m.get("post_date", "") <= until
            ]

        # Filter by confirmed status
        if confirmed_only:
            filtered_movements = [
                m for m in filtered_movements if not m.get("pending", False)
            ]

        # Simulate pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page

        movements = filtered_movements[start_idx:end_idx]

        total_movements = len(movements)
        total_filtered = len(filtered_movements)
        result_text = f"Found {total_filtered} movement(s) across all accounts (showing {total_movements} on page {page})\n\n"

        if movements:
            for i, movement in enumerate(movements, 1):
                result_text += f"Movement {i}:\n"
                result_text += f"  ID: {movement.get('id', 'N/A')}\n"
                result_text += f"  Account ID: {movement.get('account_id', 'N/A')}\n"
                result_text += f"  Amount: {movement.get('amount', 'N/A')}\n"
                result_text += f"  Currency: {movement.get('currency', 'N/A')}\n"
                result_text += f"  Description: {movement.get('description', 'N/A')}\n"
                result_text += f"  Post Date: {movement.get('post_date', 'N/A')}\n"
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


@tool(
    "aggregate_by_description",
    "Aggregate and group movements by description to analyze spending patterns",
    {
        "since": str,  # ISO 8601 date format
        "until": str,  # ISO 8601 date format
        "confirmed_only": bool,
        "min_count": int,  # Minimum number of occurrences to show
    },
)
async def aggregate_by_description(args: dict[str, Any]) -> dict[str, Any]:
    """
    Aggregate movements by their description to show spending patterns.

    Args:
        since: Date using ISO 8601. Return only movements with post_date equal or after since (optional)
        until: Date using ISO 8601. Return only movements with post_date equal or before until (optional)
        confirmed_only: Show only confirmed movements. Defaults to true (optional)
        min_count: Only show descriptions that appear at least this many times. Defaults to 1 (optional)
    """
    try:
        since = args.get("since")
        until = args.get("until")
        confirmed_only = args.get("confirmed_only", True)
        min_count = args.get("min_count", 1)

        print(f"Aggregating movements by description from Supabase")
        print(f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}")

        # Get Supabase client and aggregate movements
        db_client = get_supabase_client()
        aggregations = await db_client.aggregate_by_description(
            since=since,
            until=until,
            confirmed_only=confirmed_only,
            min_count=min_count,
        )

        # Return compact JSON response (optimized for token usage)
        total_movements = sum(agg["count"] for agg in aggregations)
        response_data = {
            "total_unique_descriptions": len(aggregations),
            "total_movements": total_movements,
            "aggregations": aggregations,
        }

        return {
            "content": [
                {"type": "text", "text": json.dumps(response_data, indent=2)}
            ]
        }

    except Exception as e:
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error aggregating movements: {str(e)}",
                }
            ]
        }


@tool(
    "aggregate_transfers_by_holder",
    "Aggregate transfer movements by recipient/sender holder name to analyze transfer patterns",
    {
        "since": str,  # ISO 8601 date format
        "until": str,  # ISO 8601 date format
        "confirmed_only": bool,
        "min_count": int,  # Minimum number of occurrences to show
    },
)
async def aggregate_transfers_by_holder(args: dict[str, Any]) -> dict[str, Any]:
    """
    Aggregate transfer movements by the holder name to show transfer patterns.

    Args:
        since: Date using ISO 8601. Return only movements with post_date equal or after since (optional)
        until: Date using ISO 8601. Return only movements with post_date equal or before until (optional)
        confirmed_only: Show only confirmed movements. Defaults to true (optional)
        min_count: Only show holders that appear at least this many times. Defaults to 1 (optional)
    """
    try:
        since = args.get("since")
        until = args.get("until")
        confirmed_only = args.get("confirmed_only", True)
        min_count = args.get("min_count", 1)

        print(f"Aggregating transfers by holder name from Supabase")
        print(f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}")

        # Get Supabase client and aggregate transfers
        db_client = get_supabase_client()
        aggregations = await db_client.aggregate_transfers_by_holder(
            since=since,
            until=until,
            confirmed_only=confirmed_only,
            min_count=min_count,
        )

        # Return compact JSON response (optimized for token usage)
        total_transfers = sum(agg["count"] for agg in aggregations)
        response_data = {
            "total_unique_holders": len(aggregations),
            "total_transfers": total_transfers,
            "aggregations": aggregations,
        }

        return {
            "content": [
                {"type": "text", "text": json.dumps(response_data, indent=2)}
            ]
        }

    except Exception as e:
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error aggregating transfers: {str(e)}",
                }
            ]
        }


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


@tool(
    "fetch_movements",
    "Retrieve movements from the Supabase database with filtering and pagination",
    {
        "since": str,  # ISO 8601 date format
        "until": str,  # ISO 8601 date format
        "per_page": int,
        "page": int,
        "confirmed_only": bool,
    },
)
async def fetch_movements(args: dict[str, Any]) -> dict[str, Any]:
    """
    Fetch movements from Supabase database for all bank accounts.

    Args:
        since: Date using ISO 8601. Return only movements with post_date >= since (optional)
        until: Date using ISO 8601. Return only movements with post_date <= until (optional)
        per_page: Amount of movements per page. Defaults to 30. Maximum is 300 (optional)
        page: The page being retrieved. Starts from 1 (optional)
        confirmed_only: Show only confirmed movements. Defaults to true (optional)
    """
    try:
        since = args.get("since")
        until = args.get("until")
        per_page = args.get("per_page", 30)
        page = args.get("page", 1)
        confirmed_only = args.get("confirmed_only", True)

        print(f"Fetching movements from Supabase")
        print(
            f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}"
        )
        print(f"Pagination: page={page}, per_page={per_page}")

        # Get Supabase client and fetch movements
        db_client = get_supabase_client()
        result = await db_client.fetch_movements(
            since=since,
            until=until,
            per_page=per_page,
            page=page,
            confirmed_only=confirmed_only,
        )

        # Return compact JSON response (optimized for token usage)
        movements = result["movements"]
        count = result["count"]

        # Format as compact JSON instead of verbose text
        response_data = {
            "total": count,
            "page": page,
            "per_page": per_page,
            "movements": movements,
        }

        return {
            "content": [
                {"type": "text", "text": json.dumps(response_data, indent=2)}
            ]
        }

    except Exception as e:
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error retrieving movements from Supabase: {str(e)}",
                }
            ]
        }


# Create SDK MCP server config for tools (in-process, not a separate MCP server)
calculator_tools = create_sdk_mcp_server(
    name="calculator",
    version="1.0.0",
    tools=[
        calculate,
        compound_interest,
        list_movements,  # Deprecated - kept for backwards compatibility
        fetch_movements,  # New: Fetches from Supabase database
        aggregate_by_description,
        aggregate_transfers_by_holder,
        get_date,
    ],
)


if __name__ == "__main__":
    import asyncio

    async def main():
        # Create Claude SDK client with tools
        options = ClaudeAgentOptions(
            mcp_servers={"Tools": calculator_tools},
            permission_mode="bypassPermissions",
            continue_conversation=True,
            allowed_tools=[
                "mcp__Tools__get_date",
                "mcp__Tools__fetch_movements",  # New: Fetches from Supabase
                "mcp__Tools__aggregate_by_description",
                "mcp__Tools__aggregate_transfers_by_holder",
                "mcp__Tools__calculate",
                "mcp__Tools__compound_interest",
            ],
            system_prompt="""Eres un contador de finanzas personales especializado en análisis de gastos.

IMPORTANTE - FLUJO OBLIGATORIO:
1. SIEMPRE debes usar la herramienta get_date PRIMERO antes de cualquier consulta sobre fechas o movimientos
2. Usa la fecha actual obtenida para calcular rangos de fechas correctamente
3. Luego usa fetch_movements con las fechas en formato ISO 8601 (YYYY-MM-DD) para obtener movimientos desde la base de datos
4. Para análisis de patrones de gasto, usa aggregate_by_description para agrupar gastos por descripción
5. Para análisis de transferencias, usa aggregate_transfers_by_holder para ver a quién transfieres

Cuando el usuario pregunte sobre períodos relativos como "la semana pasada", "este mes", etc:
- PRIMERO llama a get_date para obtener la fecha actual
- DESPUÉS calcula las fechas de inicio y fin basándote en la fecha actual obtenida
- Finalmente consulta los movimientos con fetch_movements o las herramientas de agregación

Herramientas disponibles:
- fetch_movements: Lista movimientos individuales de todas las cuentas desde la base de datos Supabase
- aggregate_by_description: Agrupa y suma movimientos por descripción para ver patrones de gasto
- aggregate_transfers_by_holder: Agrupa transferencias por el nombre del beneficiario/remitente
- get_date: Obtiene la fecha actual
- calculate: Realiza cálculos matemáticos
- compound_interest: Calcula interés compuesto

IMPORTANTE: fetch_movements devuelve datos en formato JSON compacto. Analiza el JSON y presenta los resultados de forma clara al usuario.

Tu objetivo es ayudar a los usuarios a entender su estado financiero y a tomar decisiones informadas sobre su dinero.
""",
        )

        # Use context manager for automatic connection handling
        async with ClaudeSDKClient(options=options) as client:
            try:
                print("💰 Asistente Financiero Personal")
                print("Escribe 'exit' o 'quit' para salir\n")

                while True:
                    user_input = input("Tu: ")
                    if user_input.lower() in ["exit", "quit"]:
                        print("\n👋 ¡Hasta luego!")
                        break

                    # Send query to Claude
                    await client.query(user_input)

                    # Use receive_response() instead of receive_messages()
                    # This maintains conversation context across turns
                    async for message in client.receive_response():
                        if isinstance(message, AssistantMessage):
                            if message.content:
                                for block in message.content:
                                    if isinstance(block, TextBlock):
                                        print(f"Claude: {block.text}")
                                    elif isinstance(block, ToolUseBlock):
                                        print(
                                            f"Claude: Usando herramienta {block.name}"
                                        )
                    print()
            except KeyboardInterrupt:
                print("\n\n👋 Sesión interrumpida. ¡Hasta luego!")
            except Exception as e:
                print(f"❌ Error: {e}")

    asyncio.run(main())
