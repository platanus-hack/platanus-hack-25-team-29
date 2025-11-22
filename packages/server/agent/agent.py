import math
import json
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
    List movements from a bank account for the logged-in user.

    Args:
        since: Date using ISO 8601. Return only movements with post_date equal or after since (optional)
        until: Date using ISO 8601. Return only movements with post_date equal or before until (optional)
        per_page: Amount of movements per page. Defaults to 30. Maximum is 300 (optional)
        page: The page being retrieved. Starts from 1 (optional)
        confirmed_only: Show only confirmed movements. Defaults to true (optional)
    """
    # TODO: Get account_id from logged-in user context
    # account_id = await get_user_account_id(current_user)
    account_id = "acc_01"  # Using example account ID from JSON

    try:
        # Fetch movements from database (simulated with JSON)
        since = args.get("since")
        until = args.get("until")
        per_page = args.get("per_page", 30)
        page = args.get("page", 1)
        confirmed_only = args.get("confirmed_only", True)

        print(f"Fetching movements from DB for account {account_id}")
        print(f"Filters: since={since}, until={until}, confirmed_only={confirmed_only}")
        print(f"Pagination: page={page}, per_page={per_page}")

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

        # Filter by account_id
        filtered_movements = [
            m for m in all_movements if m.get("account_id") == account_id
        ]

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
                m for m in filtered_movements if m.get("status") == "confirmed"
            ]

        # Simulate pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page

        movements = filtered_movements[start_idx:end_idx]

        total_movements = len(movements)
        result_text = f"Found {total_movements} movement(s)\n\n"

        if movements:
            for i, movement in enumerate(movements, 1):
                result_text += f"Movement {i}:\n"
                result_text += f"  ID: {movement.get('id', 'N/A')}\n"
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


# Create SDK MCP server config for tools (in-process, not a separate MCP server)
calculator_tools = create_sdk_mcp_server(
    name="calculator",
    version="1.0.0",
    tools=[calculate, compound_interest, list_movements],  # Pass decorated functions
)


if __name__ == "__main__":
    import asyncio

    async def main():
        # Create Claude SDK client with tools
        options = ClaudeAgentOptions(
            mcp_servers={"calculator": calculator_tools},
            permission_mode="bypassPermissions",
            continue_conversation=True,
        )

        # Use context manager for automatic connection handling
        async with ClaudeSDKClient(options=options) as client:
            try:
                # Example: Query Claude with access to the calculator tools
                print("Claude Agent with Calculator Tools")
                print("Type 'exit' to quit\n")

                while True:
                    user_input = input("You: ")
                    if user_input.lower() in ["exit", "quit"]:
                        break

                    # Send query to Claude
                    await client.query(user_input)

                    # Receive and print response
                    async for message in client.receive_messages():
                        if isinstance(message, AssistantMessage):
                            if message.content:
                                for block in message.content:
                                    if isinstance(block, TextBlock):
                                        print(f"Claude: {block.text}")
                                    elif isinstance(block, ToolUseBlock):
                                        print(f"Claude: Using tool {block.name}")
                    print()
            except Exception as e:
                print(f"An error occurred: {e}")

    asyncio.run(main())
