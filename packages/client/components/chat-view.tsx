"use client"
import { useState, useRef, useEffect } from "react"

type Message = {
  content: string
  role: "user" | "assistant"
  toolUses?: ToolUse[]
}
interface ToolUse {
  name: string
  input: any
  id: string
}

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [toolActivity, setToolActivity] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      const savedMessages = localStorage.getItem("chat_messages");
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (error) {
          console.error("Error parsing saved messages:", error);
        }
      }
    });
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setToolActivity('');

    let currentAssistantMessage = '';
    let currentToolUses: ToolUse[] = [];

    try {
      const response = await fetch("http://localhost:8000/api/agent", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          systemPrompt: 'You are a helpful AI assistant with access to tools.',
          maxTurns: 10
        })
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while(true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === "text") {
                currentAssistantMessage += parsed.content
                // Update the last message or create new one
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  
                  if (lastMsg?.role === 'assistant') {
                    lastMsg.content = currentAssistantMessage;
                    lastMsg.toolUses = currentToolUses;
                  } else {
                    newMessages.push({
                      role: 'assistant',
                      content: currentAssistantMessage,
                      toolUses: currentToolUses,
                    });
                  }
                  return newMessages;
                });
              } else if (parsed.type === "tool_use") {
                const toolUse: ToolUse = {
                  name: parsed.name,
                  input: parsed.input,
                  id: parsed.id || `tool-${Date.now()}`,
                };
                currentToolUses.push(toolUse);
                setToolActivity(`🔧 Using tool: ${parsed.name}`);
              } else if (parsed.type === "tool_result") {
                setToolActivity('✅ Tool completed');
                setTimeout(() => setToolActivity(''), 2000);
              } else if (parsed.type === "done") {
                setToolActivity("")
              } else if (parsed.type === "error") {
                console.error("Agent error: ", parsed.error)
                setToolActivity(`❌ Error: ${parsed.error}`);
              }
            } catch (e) {
              console.error("Parse error: ", e)
            }
          }
        }

      }
    } catch (e) {
      console.error("Parse error: ", e)
      setMessages(prev => [...prev, {
        id: messages.length + 1,
        role: 'assistant',
        content: 'Sorry, an error occurred while processing your request.',
      }]);

    } finally {
      setIsStreaming(false)
      setToolActivity('')
    }
  }

  return (
    <div className="flex flex-col h-screen w-full mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            <div className="font-semibold mb-1">
              {msg.role === 'user' ? 'You' : '🤖 Agent'}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
            
            {msg.toolUses && msg.toolUses.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-300">
                <div className="text-sm text-gray-600">Tools used:</div>
                {msg.toolUses.map((tool, i) => (
                  <div key={i} className="text-xs bg-gray-200 p-2 mt-1 rounded">
                    <span className="font-mono">{tool.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {toolActivity && (
        <div className="mb-2 text-sm text-gray-600 animate-pulse">
          {toolActivity}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask the agent something..."
          className="flex-1 p-3 border rounded-lg"
          disabled={isStreaming}
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
        >
          {isStreaming ? '⏳' : 'Send'}
        </button>
      </div>
    </div>
  )
}