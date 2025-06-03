export interface ChatMessage {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  type: "text" | "quick_reply" | "facility_card" | "emergency"
  metadata?: {
    confidence?: number
    category?: string
    suggestions?: string[]
  }
}

export interface QuickReply {
  id: string
  text: string
  payload: string
}

export interface ChatSession {
  id: string
  userId: string
  messages: ChatMessage[]
  context: {
    lastCategory?: string
    userLocation?: {
      latitude: number
      longitude: number
    }
    emergencyDetected?: boolean
  }
}
