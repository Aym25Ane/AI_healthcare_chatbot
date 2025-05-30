"use client"

import { useState, useEffect, useRef } from "react"
import type { ChatMessage, ChatSession, QuickReply } from "@/types/chat"
import { AIHealthService } from "@/lib/ai-service"
import { ChatStorageService } from "@/lib/chat-storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Mic, Trash2 } from "lucide-react"
import ChatMessageComponent from "./chat-message"
import TypingIndicator from "./typing-indicator"
import QuickReplies from "./quick-replies"
import { v4 as uuidv4 } from "uuid"

export default function ChatInterface() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const aiService = AIHealthService.getInstance()
  const storageService = ChatStorageService.getInstance()

  // Initialize chat session
  useEffect(() => {
    const session = storageService.createSession()
    setCurrentSession(session)

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content:
        "Hello! I'm your AI Health Assistant. 👋\n\nI can help you with:\n• General health questions\n• Symptom information\n• Finding nearby medical facilities\n• Emergency guidance\n\n⚠️ For medical emergencies, call emergency services immediately.\n\nHow can I help you today?",
      sender: "bot",
      timestamp: new Date(),
      type: "text",
    }

    session.messages.push(welcomeMessage)
    storageService.saveSession(session)
    setCurrentSession({ ...session })
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentSession?.messages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentSession) return

    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: content.trim(),
      sender: "user",
      timestamp: new Date(),
      type: "text",
    }

    // Add user message
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
    }
    setCurrentSession(updatedSession)
    storageService.saveSession(updatedSession)

    setInputValue("")
    setIsLoading(true)
    setShowQuickReplies(false)

    try {
      // Get AI response
      const aiResponse = await aiService.generateResponse(content, currentSession.context)

      // Create bot message
      const botMessage: ChatMessage = {
        id: uuidv4(),
        content: aiResponse.message,
        sender: "bot",
        timestamp: new Date(),
        type: aiResponse.isEmergency ? "emergency" : "text",
        metadata: {
          confidence: aiResponse.confidence,
          category: aiResponse.category,
          suggestions: aiResponse.suggestions,
        },
      }

      // If location is required, try to get facilities
      if (aiResponse.requiresLocation) {
        await handleLocationRequest(botMessage)
      }

      // Add bot message
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, botMessage],
      }
      setCurrentSession(finalSession)
      storageService.saveSession(finalSession)
    } catch (error) {
      console.error("Error getting AI response:", error)

      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        sender: "bot",
        timestamp: new Date(),
        type: "text",
      }

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
      }
      setCurrentSession(errorSession)
      storageService.saveSession(errorSession)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationRequest = async (botMessage: ChatMessage) => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        })

        const facilities = await aiService.searchNearbyFacilities(position.coords.latitude, position.coords.longitude)

        if (facilities.length > 0) {
          botMessage.metadata = {
            ...botMessage.metadata,
            facilities,
          }
          botMessage.content += "\n\nHere are some nearby medical facilities:"
        }
      } catch (error) {
        console.error("Error getting location:", error)
        botMessage.content +=
          "\n\nI couldn't access your location. You can manually search for nearby medical facilities."
      }
    }
  }

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.text)
  }

  const handleFacilityAction = (facilityId: string, action: "call" | "directions") => {
    const facility = currentSession?.messages
      .flatMap((m) => m.metadata?.facilities || [])
      .find((f) => f.id === facilityId)

    if (!facility) return

    if (action === "call" && facility.phone) {
      window.open(`tel:${facility.phone}`)
    } else if (action === "directions") {
      const address = encodeURIComponent(facility.address)
      window.open(`https://maps.google.com/maps?q=${address}`, "_blank")
    }
  }

  const clearChat = () => {
    if (currentSession) {
      storageService.deleteSession(currentSession.id)
      const newSession = storageService.createSession()
      setCurrentSession(newSession)
      setShowQuickReplies(true)
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">AI Health Assistant</h1>
            <p className="text-blue-100 text-sm">Your personal healthcare companion</p>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat} className="text-white hover:bg-blue-500">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {currentSession?.messages.map((message) => (
          <ChatMessageComponent key={message.id} message={message} onFacilityAction={handleFacilityAction} />
        ))}

        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {showQuickReplies && currentSession?.messages.length === 1 && <QuickReplies onReplySelect={handleQuickReply} />}

      {/* Input Area */}
      <div className="p-4 bg-white border-t shadow-lg">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your health question..."
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(inputValue)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" disabled>
            <Mic className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          ⚠️ This is for informational purposes only. In emergencies, call emergency services immediately.
        </p>
      </div>
    </div>
  )
}
