'use client'

import { useState, useCallback } from 'react'
import type { Message } from '@/types/plugin'

function makeId() {
  return Math.random().toString(36).slice(2)
}

function now() {
  return new Date().toISOString()
}

const SCRIPTED_RESPONSES: Array<string> = [
  "I love that idea! I'm routing this to the right creative workflow now. In a moment you'll see exactly what I come up with — consider this your creative co-pilot ready for takeoff.",
  "That sounds like a great project. I'm analyzing your intent and selecting the best workflow to bring it to life. Sit tight while I get to work!",
  "Interesting brief! I'm detecting the creative direction here and spinning up the right tools. Vizzy is all about turning descriptions into reality — watch this space.",
  "Perfect. I've understood what you're looking for. The creative engine is spinning up now — I'll show you the result in just a moment.",
]

const KEYWORD_RESPONSES: Record<string, string> = {
  poster:
    "Got it — you want a poster. I'm routing to the poster workflow and composing a layout that fits your brief. I'll have a visual concept for you shortly.",
  image:
    "On it! I'm spinning up the image generation workflow. Describe any style preferences or I'll pick the best match for your prompt.",
  logo:
    "Logo incoming. I'm analyzing your brand brief and selecting typography, color palette, and composition options. Preview coming up.",
  story:
    "A story — nice. I'm engaging the narrative workflow to develop characters, setting, and structure based on your brief. Your story draft will appear here.",
  design:
    "Design mode activated. I'm composing visual concepts based on your description. I'll show you options you can refine further.",
}

function pickResponse(content: string): string {
  const lower = content.toLowerCase()
  for (const [keyword, response] of Object.entries(KEYWORD_RESPONSES)) {
    if (lower.includes(keyword)) return response
  }
  const index = Math.floor(Math.random() * SCRIPTED_RESPONSES.length)
  return SCRIPTED_RESPONSES[index] ?? SCRIPTED_RESPONSES[0]!
}

export interface ChatDemoState {
  messages: Message[]
  isLoading: boolean
  sendMessage: (content: string) => void
}

export function useChatDemo(): ChatDemoState {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: makeId(),
      role: 'user',
      content: trimmed,
      createdAt: now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    setTimeout(() => {
      const assistantMessage: Message = {
        id: makeId(),
        role: 'assistant',
        content: pickResponse(trimmed),
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1200)
  }, [isLoading])

  return { messages, isLoading, sendMessage }
}
