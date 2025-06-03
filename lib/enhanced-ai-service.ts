import type { AIResponse } from "@/types/chat"

export class EnhancedAIService {
  private static instance: EnhancedAIService

  public static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService()
    }
    return EnhancedAIService.instance
  }

  public async generateResponse(userInput: string, conversationHistory: string[] = []): Promise<AIResponse> {
    try {
      // Call your API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userInput,
          conversationHistory: conversationHistory.slice(-10), // Keep last 10 messages for context
        }),
      })

      // Check if response is ok
      if (!response.ok) {
        console.error(`API response not ok: ${response.status} ${response.statusText}`)

        // Try to parse error response
        try {
          const errorData = await response.json()
          if (errorData.fallback) {
            return errorData.fallback
          }
          throw new Error(errorData.error || `HTTP ${response.status}`)
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      // Parse successful response
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Failed to parse successful response:", parseError)
        throw new Error("Invalid JSON response from server")
      }

      // Check if response has expected structure
      if (!data.success || !data.data) {
        console.error("Unexpected response structure:", data)
        if (data.fallback) {
          return data.fallback
        }
        throw new Error("Invalid response structure")
      }

      return data.data
    } catch (error) {
      console.error("Enhanced AI Service Error:", error)

      // Emergency fallback
      const isEmergency = this.detectEmergencyKeywords(userInput)

      if (isEmergency) {
        return {
          message:
            "🚨 I'm having technical issues, but this seems urgent. Please call emergency services immediately (911) or go to the nearest emergency room.",
          confidence: 0.95,
          category: "emergency",
          isEmergency: true,
          suggestions: ["Call 911", "Go to ER", "Get immediate help"],
        }
      }

      return {
        message:
          "I'm sorry, I'm experiencing technical difficulties. For medical emergencies, please call 911. For general health questions, please try again in a moment.",
        confidence: 0.5,
        category: "general_health",
        suggestions: ["Try again", "Call 911 if emergency", "Consult a doctor"],
      }
    }
  }

  private detectEmergencyKeywords(input: string): boolean {
    const emergencyKeywords = [
      "emergency",
      "urgent",
      "chest pain",
      "can't breathe",
      "heart attack",
      "stroke",
      "bleeding",
      "unconscious",
      "overdose",
      "suicide",
      "choking",
    ]

    const lowerInput = input.toLowerCase()
    return emergencyKeywords.some((keyword) => lowerInput.includes(keyword))
  }

  public async searchNearbyFacilities(latitude: number, longitude: number, type?: string) {
    // Mock facility data - in production, integrate with Google Places API
    const mockFacilities = [
      {
        id: "1",
        name: "City General Hospital",
        type: "hospital" as const,
        address: "123 Main St, City, State 12345",
        phone: "(555) 123-4567",
        distance: "0.8 km",
        rating: 4.5,
        isOpen: true,
      },
      {
        id: "2",
        name: "QuickCare Clinic",
        type: "clinic" as const,
        address: "456 Oak Ave, City, State 12345",
        phone: "(555) 234-5678",
        distance: "1.2 km",
        rating: 4.2,
        isOpen: true,
      },
      {
        id: "3",
        name: "HealthPlus Pharmacy",
        type: "pharmacy" as const,
        address: "789 Pine St, City, State 12345",
        phone: "(555) 345-6789",
        distance: "0.5 km",
        rating: 4.0,
        isOpen: false,
      },
    ]

    if (type) {
      return mockFacilities.filter((facility) => facility.type === type)
    }

    return mockFacilities
  }
}
