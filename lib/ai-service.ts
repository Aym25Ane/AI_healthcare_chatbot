import type { AIResponse } from "@/types/chat"

// Emergency keywords for immediate detection
const EMERGENCY_KEYWORDS = [
  "emergency",
  "urgent",
  "chest pain",
  "can't breathe",
  "heart attack",
  "stroke",
  "bleeding",
  "unconscious",
  "severe pain",
  "choking",
  "overdose",
  "suicide",
  "accident",
  "broken bone",
  "severe burn",
]

// Medical categories for response classification
const MEDICAL_CATEGORIES = {
  EMERGENCY: "emergency",
  SYMPTOMS: "symptoms",
  GENERAL_HEALTH: "general_health",
  MEDICATION: "medication",
  PREVENTION: "prevention",
  MENTAL_HEALTH: "mental_health",
  FACILITIES: "facilities",
}

// Sample responses database (in production, this would be your trained AI model)
const RESPONSE_DATABASE = {
  // Emergency responses
  emergency: [
    "🚨 This sounds like a medical emergency. Please call emergency services immediately (911) or go to the nearest emergency room. Do not delay seeking professional medical help.",
    "⚠️ For immediate medical emergencies, please contact emergency services right away. I can help you find the nearest hospital while you wait for help.",
  ],

  // Symptom-related responses
  headache: [
    "Headaches can have various causes including stress, dehydration, lack of sleep, or tension. Try resting in a dark, quiet room and staying hydrated. If headaches are severe, frequent, or accompanied by other symptoms, please consult a healthcare provider.",
    "For headache relief, consider: resting in a dark room, applying a cold or warm compress, staying hydrated, and gentle neck stretches. If pain persists or worsens, seek medical attention.",
  ],

  fever: [
    "A fever is your body's natural response to infection. Stay hydrated, rest, and monitor your temperature. For adults, consider fever-reducing medication if comfortable. Seek medical care if fever exceeds 103°F (39.4°C) or persists.",
    "Fever management includes: plenty of fluids, rest, light clothing, and fever reducers if needed. Contact a healthcare provider if fever is high, persistent, or accompanied by severe symptoms.",
  ],

  cold: [
    "Common cold symptoms typically include runny nose, sore throat, cough, and mild fever. Rest, stay hydrated, and consider over-the-counter medications for symptom relief. Most colds resolve within 7-10 days.",
    "For cold relief: get plenty of rest, drink warm fluids, use a humidifier, and consider throat lozenges. If symptoms worsen or persist beyond 10 days, consult a healthcare provider.",
  ],

  // General health responses
  general: [
    "I'm here to provide general health information and guidance. What specific health concern can I help you with today?",
    "I can help with general health questions, symptom information, and finding medical facilities. What would you like to know?",
    "For the most accurate medical advice, please consult with a healthcare professional. How can I assist you with general health information?",
  ],

  // Facility-related responses
  facilities: [
    "I can help you find nearby medical facilities. Would you like me to search for hospitals, clinics, or pharmacies in your area?",
    "Let me help you locate medical facilities nearby. I'll need your location to provide the most relevant results.",
  ],
}

export class AIHealthService {
  private static instance: AIHealthService

  public static getInstance(): AIHealthService {
    if (!AIHealthService.instance) {
      AIHealthService.instance = new AIHealthService()
    }
    return AIHealthService.instance
  }

  public async generateResponse(userInput: string, context?: any): Promise<AIResponse> {
    const cleanInput = userInput.toLowerCase().trim()

    // Check for emergency first
    if (this.detectEmergency(cleanInput)) {
      return {
        message: this.getRandomResponse("emergency"),
        confidence: 0.95,
        category: MEDICAL_CATEGORIES.EMERGENCY,
        isEmergency: true,
      }
    }

    // Analyze input for medical categories
    const category = this.categorizeInput(cleanInput)
    const response = this.generateCategoryResponse(category, cleanInput)

    return {
      message: response.message,
      confidence: response.confidence,
      category: category,
      suggestions: response.suggestions,
      requiresLocation: response.requiresLocation,
    }
  }

  private detectEmergency(input: string): boolean {
    return EMERGENCY_KEYWORDS.some((keyword) => input.includes(keyword.toLowerCase()))
  }

  private categorizeInput(input: string): string {
    // Simple keyword-based categorization
    if (input.includes("headache") || input.includes("head pain")) {
      return "headache"
    }
    if (input.includes("fever") || input.includes("temperature")) {
      return "fever"
    }
    if (input.includes("cold") || input.includes("flu") || input.includes("cough")) {
      return "cold"
    }
    if (
      input.includes("hospital") ||
      input.includes("clinic") ||
      input.includes("doctor") ||
      input.includes("pharmacy")
    ) {
      return "facilities"
    }
    if (input.includes("stress") || input.includes("anxiety") || input.includes("depression")) {
      return MEDICAL_CATEGORIES.MENTAL_HEALTH
    }

    return "general"
  }

  private generateCategoryResponse(category: string, input: string) {
    const message = this.getRandomResponse(category)
    let confidence = 0.8
    let suggestions: string[] = []
    let requiresLocation = false

    switch (category) {
      case "headache":
        suggestions = ["Find nearby pharmacy", "Relaxation techniques", "When to see a doctor"]
        confidence = 0.85
        break

      case "fever":
        suggestions = ["Temperature monitoring", "Find nearby clinic", "Fever reducers"]
        confidence = 0.85
        break

      case "cold":
        suggestions = ["Home remedies", "Find nearby pharmacy", "Prevention tips"]
        confidence = 0.8
        break

      case "facilities":
        requiresLocation = true
        suggestions = ["Hospitals nearby", "Clinics nearby", "Pharmacies nearby"]
        confidence = 0.9
        break

      default:
        suggestions = ["Common symptoms", "Find medical help", "Health tips"]
        confidence = 0.7
        break
    }

    return {
      message,
      confidence,
      suggestions,
      requiresLocation,
    }
  }

  private getRandomResponse(category: string): string {
    const responses = RESPONSE_DATABASE[category as keyof typeof RESPONSE_DATABASE] || RESPONSE_DATABASE.general
    return responses[Math.floor(Math.random() * responses.length)]
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

    // Filter by type if specified
    if (type) {
      return mockFacilities.filter((facility) => facility.type === type)
    }

    return mockFacilities
  }
}
