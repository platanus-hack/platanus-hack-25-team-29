"""
CLI interface for Claude financial assistant.
Uses shared tools from app.tools module.
"""

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from claude_agent_sdk.types import AssistantMessage, TextBlock, ToolUseBlock

from app.tools import lucas_tools, SYSTEM_PROMPT, ALLOWED_TOOLS


if __name__ == "__main__":
    import asyncio

    async def main():
        # Create Claude SDK client with shared tools configuration
        options = ClaudeAgentOptions(
            model="claude-haiku-4-5",
            mcp_servers={"Tools": lucas_tools},
            permission_mode="bypassPermissions",
            continue_conversation=False,
            allowed_tools=ALLOWED_TOOLS,
            system_prompt=SYSTEM_PROMPT,
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
