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
  { id: "deepseek-r1-distill-llama-70b", name: "Deepseek R1 70B" },
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
    <div className={cn("flex", "flex-col", "h-[500px]", "w-full")}>
      <div className={cn("flex", "justify-end", "mb-2")}>
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
 
      <Chat
        className="grow"
        messages={messages}
        handleSubmit={handleSubmit}
        input={input}
        handleInputChange={handleInputChange}
        isGenerating={isLoading}
        stop={stop}
        append={append}
        setMessages={setMessages}
        // transcribeAudio={transcribexAudio}
        suggestions={[
          "Healthy dessert",
          "Surprise me with a recipe",
          "High-protein breakfast",
        ]}
      />
    </div>
  )
}