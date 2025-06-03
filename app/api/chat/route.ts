import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI client
let openaiClient: OpenAI | null = null

try {
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 2,
    })
    console.log("✅ OpenAI client initialized successfully")
  } else {
    console.warn("⚠️ OPENAI_API_KEY not found - fallback mode enabled")
  }
} catch (error) {
  console.error("❌ Failed to initialize OpenAI client:", error)
}

// Emergency keywords
const EMERGENCY_KEYWORDS = [
  "emergency", "urgent", "chest pain", "can't breathe", "heart attack", "stroke",
  "bleeding", "unconscious", "overdose", "suicide", "choking", "severe pain",
  "broken bone", "severe burn", "accident"
]

function detectEmergencyKeywords(message: string): boolean {
  const lower = message.toLowerCase()
  return EMERGENCY_KEYWORDS.some(k => lower.includes(k))
}

function extractCategory(response: string, userMessage: string): string {
  const lowerResp = response.toLowerCase()
  const lowerMsg = userMessage.toLowerCase()

  if (lowerResp.includes("emergency") || lowerResp.includes("🚨")) return "emergency"
  if (lowerMsg.includes("symptom") || lowerMsg.includes("pain")) return "symptoms"
  if (lowerMsg.includes("prevent") || lowerMsg.includes("avoid")) return "prevention"
  if (lowerMsg.includes("stress") || lowerMsg.includes("anxiety")) return "mental_health"
  if (lowerMsg.includes("medication") || lowerMsg.includes("drug")) return "medication"
  if (lowerMsg.includes("first aid") || lowerMsg.includes("treatment")) return "first_aid"
  return "general_health"
}

function extractSuggestions(category: string): string[] {
  const suggestions: Record<string, string[]> = {
    emergency: ["Call 911", "Go to ER", "Get immediate help"],
    symptoms: ["Monitor symptoms", "See a doctor", "Rest and hydrate"],
    general_health: ["Healthy lifestyle", "Regular checkups", "Stay active"],
    prevention: ["Healthy diet", "Regular exercise", "Preventive care"],
    mental_health: ["Talk to someone", "Professional help", "Self-care"],
    medication: ["Consult pharmacist", "Follow instructions", "Check interactions"],
    first_aid: ["Stay calm", "Get help if needed", "Follow proper steps"],
  }
  return suggestions[category] || suggestions.general_health
}

async function generateFallbackResponse(userMessage: string) {
  const lower = userMessage.toLowerCase()

  if (detectEmergencyKeywords(userMessage)) {
    return {
      message: "🚨 EMERGENCY: This seems urgent. Please call emergency services (911) or go to the ER immediately.",
      isEmergency: true,
      category: "emergency",
      confidence: 0.95,
      suggestions: ["Call 911", "Go to ER", "Contact emergency services"],
    }
  }

  if (lower.includes("headache") || lower.includes("head hurt")) {
    return {
      message: "Headaches may stem from stress, dehydration, or lack of sleep. Rest and hydrate. If frequent or severe, consult a doctor.",
      isEmergency: false,
      category: "symptoms",
      confidence: 0.8,
      suggestions: ["Rest in dark room", "Stay hydrated", "See doctor if severe"],
    }
  }

  if (lower.includes("fever") || lower.includes("temperature")) {
    return {
      message: "Fever is a response to infection. Stay hydrated and rest. If over 103°F or lasts >3 days, see a doctor.",
      isEmergency: false,
      category: "symptoms",
      confidence: 0.8,
      suggestions: ["Stay hydrated", "Rest", "Monitor temperature"],
    }
  }

  if (lower.includes("cold") || lower.includes("flu") || lower.includes("cough")) {
    return {
      message: "Rest, hydrate, and use OTC meds if needed. If symptoms worsen or last >10 days, consult a doctor.",
      isEmergency: false,
      category: "symptoms",
      confidence: 0.8,
      suggestions: ["Rest", "Stay hydrated", "OTC medications"],
    }
  }

  if (lower.includes("stomach") || lower.includes("nausea") || lower.includes("vomit")) {
    return {
      message: "Try BRAT diet and rest. If symptoms last over 2 days or include blood, seek medical care.",
      isEmergency: false,
      category: "symptoms",
      confidence: 0.8,
      suggestions: ["Clear fluids", "BRAT diet", "Rest"],
    }
  }

  if (lower.includes("anxiety") || lower.includes("stress") || lower.includes("panic")) {
    return {
      message: "Try deep breathing, exercise, and self-care. Talk to a professional if needed.",
      isEmergency: false,
      category: "mental_health",
      confidence: 0.8,
      suggestions: ["Deep breathing", "Exercise", "Talk to professional"],
    }
  }

  if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("tired")) {
    return {
      message: "Maintain a regular schedule, limit screen time, and avoid caffeine before bed. See a doctor if persistent.",
      isEmergency: false,
      category: "general_health",
      confidence: 0.8,
      suggestions: ["Regular schedule", "Sleep hygiene", "Limit screens"],
    }
  }

  if (lower.includes("doctor") || lower.includes("hospital") || lower.includes("clinic")) {
    return {
      message: "Primary care for non-urgent issues, urgent care for quick access, and ER for emergencies.",
      isEmergency: false,
      category: "general_health",
      confidence: 0.8,
      suggestions: ["Primary care", "Urgent care", "Emergency room"],
    }
  }

  return {
    message: "I'm here for general health info. For urgent concerns, consult a professional or call 911.",
    isEmergency: false,
    category: "general_health",
    confidence: 0.7,
    suggestions: ["Ask specific question", "Consult doctor", "Emergency: call 911"],
  }
}

export async function POST(request: NextRequest) {
  console.log("🔄 Chat API route called")

  try {
    const body = await request.json()
    const { message, conversationHistory } = body as {
      message: string
      conversationHistory?: string[]
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required",
          fallback: await generateFallbackResponse("general health question"),
        },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY || !openaiClient) {
      console.warn("⚠️ Using fallback response (OpenAI not configured)")
      return NextResponse.json({
        success: true,
        data: await generateFallbackResponse(message),
        source: "fallback_no_api_key",
      })
    }

    const context =
      conversationHistory && conversationHistory.length > 0
        ? `Previous conversation:\n${conversationHistory.join("\n")}\n\n`
        : ""

    const systemPrompt = `You are a helpful AI health assistant. Your role is to:

1. Provide general health information and guidance
2. Help users understand symptoms and when to seek medical care
3. Offer first aid and wellness tips
4. Detect medical emergencies and urge immediate professional help

GUIDELINES:
- Include medical disclaimers
- For emergencies, advise calling emergency services
- Never diagnose specific conditions
- Be empathetic and concise (max 300 words)
- Always end with 2–3 helpful suggestions.`

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${context}Current question: ${message}` },
      ],
      max_tokens: 400,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || "Sorry, I couldn't process your request."

    console.log("✅ OpenAI response received successfully")

    const isEmergency = response.includes("🚨 EMERGENCY:")
    const category = extractCategory(response, message)
    const suggestions = extractSuggestions(category)

    return NextResponse.json({
      success: true,
      data: {
        message: response,
        isEmergency,
        category,
        confidence: 0.9,
        suggestions,
      },
      source: "openai",
    })
  } catch (error: any) {
    console.error("❌ Chat API Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        fallback: {
          message: "Sorry, I'm having technical issues. For emergencies, call 911 immediately.",
          isEmergency: false,
          category: "general_health",
          confidence: 0.5,
          suggestions: ["Call 911 if emergency", "Try again later", "Consult a doctor"],
        },
      },
      { status: 500 }
    )
  }
}
