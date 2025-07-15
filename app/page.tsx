"use client"
 
import { useState } from "react"
import { useChat, type UseChatOptions } from "@ai-sdk/react"
 
import { cn } from "@/lib/utils"
import { Chat } from "@/components/ui/chat"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
 
const MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
  { id: "o4-mini", name: "o4-mini" },
]
 
type ChatDemoProps = {
  initialMessages?: UseChatOptions["initialMessages"]
}
 
export default function Home(props: ChatDemoProps) {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    stop,
    status,
    setMessages,
  } = useChat({
    ...props,
    api: "/api/chat",
    body: {
      model: selectedModel,
    },
  })
 
  const isLoading = status === "submitted" || status === "streaming"
 
  return (
    <main className="flex h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl border bg-background shadow-xl">
        <div className="p-6">
          <h1 className="text-lg font-semibold">ChefMate</h1>
          <p className="text-sm text-muted-foreground">
            Your personal cooking assistant
          </p>
        </div>

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
            setMessages={setMessages}
            suggestions={[
              "Healthy dessert",
              "Surprise me with a recipe",
              "High-protein breakfast",
            ]}
          />
        </div>

        <div className="flex items-center justify-end border-t p-4">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </main>
  )
}