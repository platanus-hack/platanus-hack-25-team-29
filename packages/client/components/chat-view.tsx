"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "./ui/button"
import { SendHorizontal } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { ScrollArea } from "./ui/scroll-area"
import { cn } from "@/lib/utils"

type Message = {
  id: number
  content: string
  role: "user" | "assistant"
}

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const handleSendMessage = async (message: string) => {
    if (!message) return

    setMessages((prevMessages: Message[]) => {
      const userMessage: Message = { id: prevMessages.length + 1, content: message, role: "user" };
      const updatedMessages = [...prevMessages, userMessage];
      localStorage.setItem("chat_messages", JSON.stringify(updatedMessages));
      return updatedMessages;
    });

    if (textareaRef.current) {
      textareaRef.current.value = "";
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await Promise.resolve({
      json: () => Promise.resolve({
        choices: [{ message: { content: "Flaco, te gastaste toda la plata!" } }]
      })
    })
    const data = await response.json()

    setMessages((prevMessages: Message[]) => {
      const assistantMessage: Message = {
        id: prevMessages.length + 1,
        content: data.choices[0].message.content,
        role: "assistant"
      };
      const updatedMessages = [...prevMessages, assistantMessage];
      localStorage.setItem("chat_messages", JSON.stringify(updatedMessages));
      return updatedMessages;
    });
  }

  return (
    <div className="flex flex-col w-full max-h-screen">
      <ScrollArea className="h-160 max-h-160 px-50 py-10">
        <div className="flex flex-col gap-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "flex justify-end my-2"
                  : "flex justify-start my-2"
              }
            >
              <div className={cn(
                "rounded-lg px-4 py-2 max-w-xl",
                message.role === "user" ? "bg-gray-100" : "bg-primary text-primary-foreground"
              )}>
                <p>{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2 w-full bg-gray-100 p-4 h-50 justify-center">
        <Textarea
          ref={textareaRef}
          className="rounded-lg bg-background w-xl max-h-30 overflow-y-auto"
          rows={3}
          placeholder="Pregúntale algo a Lucas..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(textareaRef.current?.value || "");
            }
          }}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSendMessage(textareaRef.current?.value || "")}
        >
          <SendHorizontal />
        </Button>
      </div>
    </div>
  )
}