import type { ChatSession, ChatMessage } from "@/types/chat"
import { v4 as uuidv4 } from "uuid"

export class ChatStorageService {
  private static instance: ChatStorageService
  private readonly STORAGE_KEY = "healthcare_chat_sessions"

  public static getInstance(): ChatStorageService {
    if (!ChatStorageService.instance) {
      ChatStorageService.instance = new ChatStorageService()
    }
    return ChatStorageService.instance
  }

  public createSession(): ChatSession {
    const session: ChatSession = {
      id: uuidv4(),
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.saveSession(session)
    return session
  }

  public saveSession(session: ChatSession): void {
    session.updatedAt = new Date()
    const sessions = this.getAllSessions()
    const existingIndex = sessions.findIndex((s) => s.id === session.id)

    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.push(session)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions))
  }

  public getSession(sessionId: string): ChatSession | null {
    const sessions = this.getAllSessions()
    return sessions.find((s) => s.id === sessionId) || null
  }

  public getAllSessions(): ChatSession[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const sessions = JSON.parse(stored)
      return sessions.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }))
    } catch (error) {
      console.error("Error loading chat sessions:", error)
      return []
    }
  }

  public addMessage(sessionId: string, message: ChatMessage): void {
    const session = this.getSession(sessionId)
    if (session) {
      session.messages.push(message)
      this.saveSession(session)
    }
  }

  public deleteSession(sessionId: string): void {
    const sessions = this.getAllSessions()
    const filtered = sessions.filter((s) => s.id !== sessionId)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  public clearAllSessions(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}
