"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"

import { Chat } from "@/components/ui/chat"
import { Header } from "@/components/header"
import { ModelSelector } from "@/components/model-selector"

const SUGGESTIONS = [
  "Suggest me 3 recipes from the italian cuisine",
  "What's the nutrition facts of a caesar salad?",
  "Can you list me the ingredients needed to make a lasagna silvia?",
]

export default function Home() {
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    stop,
    status,
  } = useChat({
    api: "/api/chat",
    body: {
      data: {
        model: selectedModel,
      },
    },
  })

  const isLoading = status === "submitted" || status === "streaming"

  return (
    <main className="flex h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl border bg-background shadow-xl">
        <Header />

        <div className="h-[60vh] p-6 pt-0">
          <Chat
            className="h-full"
            messages={messages}
            handleSubmit={handleSubmit}
            input={input}
            handleInputChange={handleInputChange}
            isGenerating={isLoading}
            stop={stop}
            append={append}
            suggestions={SUGGESTIONS}
          />
        </div>

        <div className="flex items-center justify-end border-t p-4">
          <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
        </div>
      </div>
    </main>
  )
}