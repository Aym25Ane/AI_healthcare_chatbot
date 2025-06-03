export interface ChatMessage {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  type: "text" | "quick_reply" | "facility_card" | "emergency" | "typing"
  metadata?: {
    confidence?: number
    category?: string
    suggestions?: string[]
    facilities?: MedicalFacility[]
  }
}

export interface MedicalFacility {
  id: string
  name: string
  type: "hospital" | "clinic" | "pharmacy" | "doctor"
  address: string
  phone?: string
  distance?: string
  rating?: number
  isOpen?: boolean
}

export interface QuickReply {
  id: string
  text: string
  payload: string
  icon?: string
}

export interface ChatSession {
  id: string
  messages: ChatMessage[]
  context: {
    lastCategory?: string
    userLocation?: {
      latitude: number
      longitude: number
    }
    emergencyDetected?: boolean
    userName?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface AIResponse {
  message: string
  confidence: number
  category: string
  suggestions?: string[]
  requiresLocation?: boolean
  isEmergency?: boolean
}
