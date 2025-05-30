"use client"

import type { ChatMessage } from "@/types/chat"
import { Bot, User, AlertTriangle, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatMessageProps {
  message: ChatMessage
  onFacilityAction?: (facilityId: string, action: "call" | "directions") => void
}

export default function ChatMessageComponent({ message, onFacilityAction }: ChatMessageProps) {
  const isUser = message.sender === "user"
  const isEmergency = message.type === "emergency"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md ${isUser ? "flex-row-reverse" : "flex-row"} items-start space-x-2`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-blue-600 ml-2" : "bg-gray-200 mr-2"
          }`}
        >
          {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-gray-600" />}
        </div>

        {/* Message Content */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? "bg-blue-600 text-white"
              : isEmergency
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-white text-gray-800 shadow-md border"
          }`}
        >
          {/* Emergency indicator */}
          {isEmergency && (
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm font-semibold text-red-600">EMERGENCY</span>
            </div>
          )}

          {/* Message text */}
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>

          {/* Facility cards */}
          {message.metadata?.facilities && (
            <div className="mt-3 space-y-2">
              {message.metadata.facilities.map((facility) => (
                <div key={facility.id} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">{facility.name}</h4>
                      <p className="text-xs text-gray-600 capitalize">{facility.type}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {facility.isOpen ? (
                        <span className="text-xs text-green-600 font-medium">Open</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">Closed</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">{facility.address}</p>

                  {facility.distance && <p className="text-xs text-blue-600 mb-2">📍 {facility.distance}</p>}

                  <div className="flex space-x-2">
                    {facility.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onFacilityAction?.(facility.id, "call")}
                        className="text-xs"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onFacilityAction?.(facility.id, "directions")}
                      className="text-xs"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Directions
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {message.metadata?.suggestions && (
            <div className="mt-3 flex flex-wrap gap-1">
              {message.metadata.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="ghost"
                  className="text-xs h-6 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className={`text-xs mt-2 ${isUser ? "text-blue-100" : "text-gray-500"}`}>
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  )
}
