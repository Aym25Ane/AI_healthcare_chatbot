// This file will only run on the server side (API routes)
import OpenAI from "openai"

let openaiClient: OpenAI | null = null

// Only initialize on server side
if (typeof window === "undefined" && process.env.OPENAI_API_KEY) {
  try {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", error)
  }
}

export class OpenAIHealthService {
  private static instance: OpenAIHealthService

  public static getInstance(): OpenAIHealthService {
    if (!OpenAIHealthService.instance) {
      OpenAIHealthService.instance = new OpenAIHealthService()
    }
    return OpenAIHealthService.instance
  }

  public async generateHealthResponse(
    userMessage: string,
    conversationHistory: string[] = [],
  ): Promise<{
    message: string
    isEmergency: boolean
    category: string
    confidence: number
    suggestions: string[]
  }> {
    // This method should only be called from server-side API routes
    if (typeof window !== "undefined") {
      throw new Error("This method can only be called on the server side")
    }

    // Check if OpenAI client is available
    if (!openaiClient) {
      console.error("OpenAI client not initialized")
      throw new Error("AI service not available")
    }

    try {
      // Build conversation context
      const context =
        conversationHistory.length > 0 ? `Previous conversation:\n${conversationHistory.join("\n")}\n\n` : ""

      const systemPrompt = `You are a helpful AI health assistant. Your role is to:

1. Provide general health information and guidance
2. Help users understand symptoms and when to seek medical care
3. Offer first aid and wellness tips
4. Detect medical emergencies and urge immediate professional help

IMPORTANT GUIDELINES:
- Always include medical disclaimers
- For emergencies, immediately advise calling emergency services
- Never diagnose specific conditions
- Encourage consulting healthcare professionals for serious concerns
- Be empathetic and supportive
- Keep responses concise but informative (max 300 words)

EMERGENCY KEYWORDS to watch for: chest pain, can't breathe, heart attack, stroke, severe bleeding, unconscious, overdose, severe burns, choking, suicide thoughts

If you detect an emergency, start your response with "🚨 EMERGENCY:" and immediately advise calling emergency services.

For non-emergency responses, categorize your response as one of:
- symptoms
- general_health  
- prevention
- mental_health
- medication
- first_aid

Always end with 2-3 helpful suggestions related to the topic.`

      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${context}Current question: ${userMessage}` },
        ],
        max_tokens: 400,
        temperature: 0.7,
        timeout: 30000, // 30 second timeout
      })

      const response =
        completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request right now."

      // Analyze the response
      const isEmergency = response.includes("🚨 EMERGENCY:")
      const category = this.extractCategory(response, userMessage)
      const suggestions = this.extractSuggestions(response, category)

      return {
        message: response,
        isEmergency,
        category,
        confidence: 0.9, // High confidence for OpenAI responses
        suggestions,
      }
    } catch (error) {
      console.error("OpenAI API Error:", error)

      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          throw new Error("AI service timeout - please try again")
        }
        if (error.message.includes("rate limit")) {
          throw new Error("AI service temporarily unavailable - please try again in a moment")
        }
        if (error.message.includes("insufficient_quota")) {
          throw new Error("AI service quota exceeded")
        }
      }

      // Fallback to emergency detection
      const isEmergency = this.detectEmergencyKeywords(userMessage)

      if (isEmergency) {
        return {
          message:
            "🚨 EMERGENCY: I'm having trouble processing your request, but this seems urgent. Please call emergency services immediately (911) or go to the nearest emergency room.",
          isEmergency: true,
          category: "emergency",
          confidence: 0.95,
          suggestions: ["Call 911", "Go to ER", "Contact emergency services"],
        }
      }

      // Re-throw the error to be handled by the API route
      throw error
    }
  }

  private detectEmergencyKeywords(message: string): boolean {
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
      "severe pain",
      "broken bone",
      "severe burn",
      "accident",
    ]

    const lowerMessage = message.toLowerCase()
    return emergencyKeywords.some((keyword) => lowerMessage.includes(keyword))
  }

  private extractCategory(response: string, userMessage: string): string {
    const lowerResponse = response.toLowerCase()
    const lowerMessage = userMessage.toLowerCase()

    if (lowerResponse.includes("emergency") || lowerResponse.includes("🚨")) {
      return "emergency"
    }
    if (lowerMessage.includes("symptom") || lowerMessage.includes("pain") || lowerMessage.includes("hurt")) {
      return "symptoms"
    }
    if (lowerMessage.includes("prevent") || lowerMessage.includes("avoid")) {
      return "prevention"
    }
    if (lowerMessage.includes("stress") || lowerMessage.includes("anxiety") || lowerMessage.includes("depression")) {
      return "mental_health"
    }
    if (lowerMessage.includes("medication") || lowerMessage.includes("drug") || lowerMessage.includes("pill")) {
      return "medication"
    }
    if (lowerMessage.includes("first aid") || lowerMessage.includes("treatment")) {
      return "first_aid"
    }

    return "general_health"
  }

  private extractSuggestions(response: string, category: string): string[] {
    // Default suggestions based on category
    const defaultSuggestions: Record<string, string[]> = {
      emergency: ["Call 911", "Go to ER", "Get immediate help"],
      symptoms: ["Monitor symptoms", "See a doctor", "Rest and hydrate"],
      general_health: ["Healthy lifestyle", "Regular checkups", "Stay active"],
      prevention: ["Healthy diet", "Regular exercise", "Preventive care"],
      mental_health: ["Talk to someone", "Professional help", "Self-care"],
      medication: ["Consult pharmacist", "Follow instructions", "Check interactions"],
      first_aid: ["Stay calm", "Get help if needed", "Follow proper steps"],
    }

    return defaultSuggestions[category] || defaultSuggestions.general_health
  }
}
