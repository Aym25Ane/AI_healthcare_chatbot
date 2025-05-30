"use client"

import type { QuickReply } from "@/types/chat"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, AlertTriangle, Lightbulb } from "lucide-react"

interface QuickRepliesProps {
  onReplySelect: (reply: QuickReply) => void
}

export default function QuickReplies({ onReplySelect }: QuickRepliesProps) {
  const quickReplies: QuickReply[] = [
    {
      id: "1",
      text: "I have a headache",
      payload: "headache_symptoms",
      icon: "head",
    },
    {
      id: "2",
      text: "Find nearby hospital",
      payload: "find_hospital",
      icon: "map",
    },
    {
      id: "3",
      text: "Emergency help",
      payload: "emergency",
      icon: "emergency",
    },
    {
      id: "4",
      text: "Health tips",
      payload: "health_tips",
      icon: "tips",
    },
  ]

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "head":
        return <Heart className="w-4 h-4" />
      case "map":
        return <MapPin className="w-4 h-4" />
      case "emergency":
        return <AlertTriangle className="w-4 h-4" />
      case "tips":
        return <Lightbulb className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="p-4 bg-white border-t">
      <p className="text-sm text-gray-600 mb-3">Quick questions:</p>
      <div className="grid grid-cols-2 gap-2">
        {quickReplies.map((reply) => (
          <Button
            key={reply.id}
            variant="outline"
            size="sm"
            onClick={() => onReplySelect(reply)}
            className="text-xs h-auto py-2 px-3 flex items-center justify-start space-x-2"
          >
            {reply.icon && getIcon(reply.icon)}
            <span>{reply.text}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
