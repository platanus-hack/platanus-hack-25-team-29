from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from claude_agent_sdk.types import (
    AssistantMessage,
    StreamEvent,
    TextBlock,
    ToolUseBlock,
)
from typing import AsyncIterator
import json

from app.tools import lucas_tools, SYSTEM_PROMPT, ALLOWED_TOOLS

router = APIRouter()


class AgentRequest(BaseModel):
    prompt: str
    system_prompt: str | None = None
    max_turns: int = 10


async def agent_stream(
    prompt: str, system_prompt: str | None, max_turns: int
) -> AsyncIterator[str]:
    """Generator that yields SSE formatted messages from Claude Agent"""
    try:
        # Create agent options with shared tools
        options = ClaudeAgentOptions(
            model="claude-haiku-4-5",
            mcp_servers={"Tools": lucas_tools},
            permission_mode="bypassPermissions",
            continue_conversation=True,
            allowed_tools=ALLOWED_TOOLS,
            system_prompt=system_prompt or SYSTEM_PROMPT,
            include_partial_messages=True,
        )

        # Use async context manager for proper connection handling
        async with ClaudeSDKClient(options=options) as client:
            # Send the user's query
            await client.query(prompt)

            has_streamed_text = False
            streamed_tool_use_ids: set[str] = set()

            # Stream responses from Claude
            async for message in client.receive_response():
                if isinstance(message, StreamEvent):
                    event_type = message.event.get("type")

                    if event_type == "content_block_delta":
                        delta = message.event.get("delta") or {}
                        if delta.get("type") == "text_delta":
                            text_chunk = delta.get("text")
                            if text_chunk:
                                has_streamed_text = True
                                event_data = {"type": "text", "content": text_chunk}
                                yield f"data: {json.dumps(event_data)}\n\n"

                    elif event_type == "content_block_start":
                        block = message.event.get("content_block") or {}
                        if block.get("type") == "tool_use":
                            tool_id = block.get("id")
                            if tool_id and tool_id not in streamed_tool_use_ids:
                                streamed_tool_use_ids.add(tool_id)
                                event_data = {
                                    "type": "tool_use",
                                    "name": block.get("name"),
                                    "input": block.get("input"),
                                    "id": tool_id,
                                }
                                yield f"data: {json.dumps(event_data)}\n\n"

                    continue

                if isinstance(message, AssistantMessage):
                    if message.content:
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                if has_streamed_text:
                                    continue
                                event_data = {"type": "text", "content": block.text}
                                yield f"data: {json.dumps(event_data)}\n\n"

                            elif isinstance(block, ToolUseBlock):
                                if block.id in streamed_tool_use_ids:
                                    continue
                                streamed_tool_use_ids.add(block.id)
                                event_data = {
                                    "type": "tool_use",
                                    "name": block.name,
                                    "input": block.input,
                                    "id": block.id,
                                }
                                yield f"data: {json.dumps(event_data)}\n\n"

            # Send completion event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        # Send error event
        error_event = {"type": "error", "message": str(e)}
        yield f"data: {json.dumps(error_event)}\n\n"


@router.post("/api/agent")
async def agent_endpoint(request: AgentRequest):
    """Main endpoint for streaming agent responses via SSE"""
    return StreamingResponse(
        agent_stream(request.prompt, request.system_prompt, request.max_turns),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable proxy buffering
        },
    )
