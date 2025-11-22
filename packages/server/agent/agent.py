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

        print(f"Aggregating movements by description")
        print(f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}")

        # Load data from JSON file
        db_path = Path(__file__).parent.parent / "db" / "example_data.json"
        try:
            with open(db_path, "r") as f:
                data = json.load(f)
                all_movements = data.get("movements", [])
        except FileNotFoundError:
            print(f"Database file not found at {db_path}")
            return {
                "content": [{"type": "text", "text": "Error: Database file not found."}]
            }

        # Apply filters
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

        # Aggregate by description
        aggregations = {}
        for movement in filtered_movements:
            description = movement.get("description", "Unknown")
            amount = movement.get("amount", 0)
            currency = movement.get("currency", "CLP")

            if description not in aggregations:
                aggregations[description] = {
                    "count": 0,
                    "total_amount": 0,
                    "currency": currency,
                    "amounts": [],
                }

            aggregations[description]["count"] += 1
            aggregations[description]["total_amount"] += amount
            aggregations[description]["amounts"].append(amount)

        # Filter by min_count
        aggregations = {
            desc: data
            for desc, data in aggregations.items()
            if data["count"] >= min_count
        }

        # Sort by total amount (absolute value, descending)
        sorted_aggregations = sorted(
            aggregations.items(), key=lambda x: abs(x[1]["total_amount"]), reverse=True
        )

        # Format result
        result_text = f"Found {len(sorted_aggregations)} unique description(s) with {sum(a['count'] for _, a in sorted_aggregations)} total movements\n\n"

        if sorted_aggregations:
            for i, (description, data) in enumerate(sorted_aggregations, 1):
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

        print(f"Aggregating transfers by holder name")
        print(f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}")

        # Load data from JSON file
        db_path = Path(__file__).parent.parent / "db" / "example_data.json"
        try:
            with open(db_path, "r") as f:
                data = json.load(f)
                all_movements = data.get("movements", [])
        except FileNotFoundError:
            print(f"Database file not found at {db_path}")
            return {
                "content": [{"type": "text", "text": "Error: Database file not found."}]
            }

        # Filter only transfer type movements
        filtered_movements = [m for m in all_movements if m.get("type") == "transfer"]

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

        # Aggregate by holder name
        aggregations = {}
        for movement in filtered_movements:
            amount = movement.get("amount", 0)
            currency = movement.get("currency", "CLP")

            # Get holder name from recipient or sender
            holder_name = None
            holder_type = None
            institution_name = None

            if movement.get("recipient_account"):
                holder_name = movement["recipient_account"].get("holder_name")
                holder_type = "sent to"
                institution_name = (
                    movement["recipient_account"]
                    .get("institution", {})
                    .get("name", "Unknown")
                )
            elif movement.get("sender_account"):
                holder_name = movement["sender_account"].get("holder_name")
                holder_type = "received from"
                institution_name = (
                    movement["sender_account"]
                    .get("institution", {})
                    .get("name", "Unknown")
                )

            if not holder_name:
                holder_name = "Unknown"
                holder_type = "unknown"
                institution_name = "Unknown"

            key = holder_name

            if key not in aggregations:
                aggregations[key] = {
                    "count": 0,
                    "total_amount": 0,
                    "currency": currency,
                    "holder_type": holder_type,
                    "institution": institution_name,
                    "amounts": [],
                }

            aggregations[key]["count"] += 1
            aggregations[key]["total_amount"] += amount
            aggregations[key]["amounts"].append(amount)

        # Filter by min_count
        aggregations = {
            holder: data
            for holder, data in aggregations.items()
            if data["count"] >= min_count
        }

        # Sort by total amount (absolute value, descending)
        sorted_aggregations = sorted(
            aggregations.items(), key=lambda x: abs(x[1]["total_amount"]), reverse=True
        )

        # Format result
        result_text = f"Found {len(sorted_aggregations)} unique holder(s) with {sum(a['count'] for _, a in sorted_aggregations)} total transfers\n\n"

        if sorted_aggregations:
            for i, (holder_name, data) in enumerate(sorted_aggregations, 1):
                count = data["count"]
                total = data["total_amount"]
                currency = data["currency"]
                avg = total / count if count > 0 else 0
                holder_type = data["holder_type"]
                institution = data["institution"]

                result_text += f"{i}. {holder_name}\n"
                result_text += f"   Institution: {institution}\n"
                result_text += f"   Type: {holder_type}\n"
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
calculator_tools = create_sdk_mcp_server(
    name="calculator",
    version="1.0.0",
    tools=[
        calculate,
        compound_interest,
        list_movements,
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
                "mcp__Tools__list_movements",
                "mcp__Tools__aggregate_by_description",
                "mcp__Tools__aggregate_transfers_by_holder",
                "mcp__Tools__calculate",
                "mcp__Tools__compound_interest",
            ],
            system_prompt="""Eres un contador de finanzas personales especializado en análisis de gastos.

IMPORTANTE - FLUJO OBLIGATORIO:
1. SIEMPRE debes usar la herramienta get_date PRIMERO antes de cualquier consulta sobre fechas o movimientos
2. Usa la fecha actual obtenida para calcular rangos de fechas correctamente
3. Luego usa list_movements con las fechas en formato ISO 8601 (YYYY-MM-DD)
4. Para análisis de patrones de gasto, usa aggregate_by_description para agrupar gastos por descripción
5. Para análisis de transferencias, usa aggregate_transfers_by_holder para ver a quién transfieres

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
