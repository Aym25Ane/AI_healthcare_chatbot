"use client"

import { useState, useEffect, useRef } from "react"
import type { ChatMessage, ChatSession, QuickReply } from "@/types/chat"
import { EnhancedAIService } from "@/lib/enhanced-ai-service"
import { ChatStorageService } from "@/lib/chat-storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Mic, Trash2, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import ChatMessageComponent from "./chat-message"
import TypingIndicator from "./typing-indicator"
import QuickReplies from "./quick-replies"
import { v4 as uuidv4 } from "uuid"

export default function EnhancedChatInterface() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connected")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const aiService = EnhancedAIService.getInstance()
  const storageService = ChatStorageService.getInstance()

  // Initialize chat session
  useEffect(() => {
    const session = storageService.createSession()
    setCurrentSession(session)

    // Add enhanced welcome message
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content: `Hello! I'm your AI Health Assistant powered by advanced AI. 👋

I can help you with:
• 🩺 Symptom information and guidance
• 🏥 Finding nearby medical facilities  
• 🚨 Emergency detection and response
• 💊 General health and wellness advice
• 🧠 Mental health support

⚠️ **Important**: This is for informational purposes only. For medical emergencies, call emergency services immediately.

How can I help you today?`,
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

  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

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
    setConnectionStatus("connecting")
    setErrorMessage(null)

    try {
      // Get conversation history for context
      const conversationHistory = updatedSession.messages
        .slice(-10) // Last 10 messages
        .map((msg) => `${msg.sender}: ${msg.content}`)

      // Get AI response using OpenAI
      const aiResponse = await aiService.generateResponse(content, conversationHistory)
      setConnectionStatus("connected")

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
      if (
        aiResponse.requiresLocation ||
        content.toLowerCase().includes("nearby") ||
        content.toLowerCase().includes("hospital") ||
        content.toLowerCase().includes("clinic") ||
        content.toLowerCase().includes("pharmacy")
      ) {
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
      setConnectionStatus("disconnected")

      // Set user-friendly error message
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred"
      setErrorMessage(errorMsg)

      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content:
          "I'm sorry, I'm having trouble connecting to my AI service right now. For medical emergencies, please call 911 immediately. Please try again in a moment.",
        sender: "bot",
        timestamp: new Date(),
        type: "text",
        metadata: {
          confidence: 0.5,
          category: "error",
          suggestions: ["Try again", "Call 911 if emergency", "Check connection"],
        },
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
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false,
          })
        })

        const facilities = await aiService.searchNearbyFacilities(position.coords.latitude, position.coords.longitude)

        if (facilities.length > 0) {
          botMessage.metadata = {
            ...botMessage.metadata,
            facilities,
          }
          botMessage.content += "\n\n🏥 Here are some nearby medical facilities:"
        }
      } catch (error) {
        console.error("Error getting location:", error)
        botMessage.content +=
          "\n\n📍 I couldn't access your location. You can manually search for nearby medical facilities or enable location services."
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
      setConnectionStatus("connected")
      setErrorMessage(null)
    }
  }

  const retryConnection = () => {
    setConnectionStatus("connected")
    setErrorMessage(null)
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
      {/* Enhanced Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              🤖 AI Health Assistant
              {connectionStatus === "connected" ? (
                <Wifi className="ml-2 w-4 h-4 text-green-400" />
              ) : connectionStatus === "connecting" ? (
                <div className="ml-2 w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <WifiOff className="ml-2 w-4 h-4 text-red-400" />
              )}
            </h1>
            <p className="text-blue-100 text-sm">
              Powered by OpenAI •{" "}
              {connectionStatus === "connected"
                ? "Online"
                : connectionStatus === "connecting"
                  ? "Connecting..."
                  : "Offline"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat} className="text-white hover:bg-blue-500">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex justify-between items-center">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">Error: {errorMessage}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={retryConnection} className="text-red-700 border-red-300">
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Connection Warning */}
      {connectionStatus === "disconnected" && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Connection issues detected. For emergencies, call 911 immediately.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Enhanced Input Area */}
      <div className="p-4 bg-white border-t shadow-lg">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about your health concerns..."
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
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            ⚠️ For emergencies, call 911 immediately • AI responses are for information only
          </p>
          <p className="text-xs text-gray-400">Powered by OpenAI GPT-4</p>
        </div>
      </div>
    </div>
  )
}
