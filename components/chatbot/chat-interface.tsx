"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Mic } from "lucide-react"

interface ChatMessage {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  type: "text" | "quick_reply" | "facility_card" | "emergency"
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initial welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: "1",
      content:
        "Hello! I'm your AI Health Assistant. I can help you with:\n\n• General health questions\n• Symptom information\n• Finding nearby medical facilities\n• Emergency guidance\n\nHow can I help you today?",
      sender: "bot",
      timestamp: new Date(),
      type: "text",
    }
    setMessages([welcomeMessage])
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Send to your Django backend
      const response = await fetch("/api/chatbot/message/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          message: inputValue,
          session_id: sessionId,
        }),
      })

      const data = await response.json()

      if (!sessionId) {
        setSessionId(data.session_id)
      }

      const botMessage: ChatMessage = {
        id: data.bot_message.id,
        content: data.bot_message.content,
        sender: "bot",
        timestamp: new Date(data.bot_message.timestamp),
        type: "text",
      }

      setMessages((prev) => [...prev, botMessage])

      // Check if we should suggest facilities
      if (shouldSuggestFacilities(inputValue)) {
        suggestNearbyFacilities()
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        type: "text",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const shouldSuggestFacilities = (message: string): boolean => {
    const facilityKeywords = ["doctor", "hospital", "clinic", "emergency", "appointment", "near me"]
    return facilityKeywords.some((keyword) => message.toLowerCase().includes(keyword))
  }

  const suggestNearbyFacilities = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const response = await fetch(
            `/api/locations/nearby/?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`,
            {
              headers: {
                Authorization: `Token ${localStorage.getItem("authToken")}`,
              },
            },
          )
          const facilities = await response.json()

          if (facilities.length > 0) {
            const facilityMessage: ChatMessage = {
              id: Date.now().toString(),
              content: "I found some nearby medical facilities for you:",
              sender: "bot",
              timestamp: new Date(),
              type: "facility_card",
            }
            setMessages((prev) => [...prev, facilityMessage])
          }
        } catch (error) {
          console.error("Error fetching facilities:", error)
        }
      })
    }
  }

  const quickReplies = [
    { text: "I have a headache", payload: "headache_symptoms" },
    { text: "Find nearby hospital", payload: "find_hospital" },
    { text: "Emergency help", payload: "emergency" },
    { text: "General health tips", payload: "health_tips" },
  ]

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">AI Health Assistant</h2>
        <p className="text-blue-100 text-sm">Always here to help with your health questions</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-800 shadow-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">{message.timestamp.toLocaleTimeString()}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-md px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length === 1 && (
        <div className="p-4 bg-white border-t">
          <p className="text-sm text-gray-600 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply.payload}
                variant="outline"
                size="sm"
                onClick={() => setInputValue(reply.text)}
                className="text-xs"
              >
                {reply.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your health question..."
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Mic className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ⚠️ This is for informational purposes only. In emergencies, call emergency services.
        </p>
      </div>
    </div>
  )
}
