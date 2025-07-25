"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type Dispatch,
  type SetStateAction,
} from "react"
import { ArrowDown, ThumbsDown, ThumbsUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import { Button } from "@/components/ui/button"
import { type Message, type MessagePart } from "@/components/ui/chat-message"
import { CopyButton } from "@/components/ui/copy-button"
import { MessageInput } from "@/components/ui/message-input"
import { MessageList } from "@/components/ui/message-list"
import { PromptSuggestions } from "@/components/ui/prompt-suggestions"

interface ChatPropsBase {
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  messages: Array<Message>
  input: string
  className?: string
  handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement>
  isGenerating: boolean
  stop?: () => void
  onRateResponse?: (
    messageId: string,
    rating: "thumbs-up" | "thumbs-down"
  ) => void
  setMessages?: Dispatch<SetStateAction<Message[]>>
}

interface ChatPropsWithoutSuggestions extends ChatPropsBase {
  append?: never
  suggestions?: never
}

interface ChatPropsWithSuggestions extends ChatPropsBase {
  append: (message: { role: "user"; content: string }) => void
  suggestions: string[]
}

type ChatProps = ChatPropsWithoutSuggestions | ChatPropsWithSuggestions

export function Chat({
  messages,
  handleSubmit,
  input,
  handleInputChange,
  stop,
  isGenerating,
  append,
  suggestions,
  className,
  onRateResponse,
  setMessages,
}: ChatProps) {
  const lastMessage = messages.at(-1)
  const isEmpty = messages.length === 0
  const isTyping = lastMessage?.role === "user"

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const [quickReplies, setQuickReplies] = useState<string[]>([])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]

    if (isGenerating || !lastMessage || lastMessage.role !== "assistant") {
      setQuickReplies([])
      return
    }

    const content = lastMessage.content
    let newSuggestions: string[] = []

    const ingredientsRegex = /ingredients:/i
    const instructionsRegex = /instructions:/i
    const hasIngredients = ingredientsRegex.test(content)
    const hasInstructions = instructionsRegex.test(content)

    const cleanRecipeName = (str: string) => {
      return str.trim().replace(/["*]/g, "")
    }

    if (hasIngredients && hasInstructions) {
      let title = ""
      const firstLine = content.split("\n")[0].trim()

      const introSentenceRegex = /for the (.*?)(\.|$|:)/i
      const introMatch = firstLine.match(introSentenceRegex)

      if (introMatch && introMatch[1]) {
        title = introMatch[1]
      } else if (!ingredientsRegex.test(firstLine)) {
        title = firstLine
      }

      if (title) {
        newSuggestions.push(
          `Show nutrition facts for ${cleanRecipeName(title)}`
        )
      } else {
        newSuggestions.push("Show nutrition facts for this recipe")
      }
      newSuggestions.push("Find another recipe")
    } else {
      const recipeListRegex = /^\s*\d+\.\s+(.*)/gm
      const recipeMatches = [...content.matchAll(recipeListRegex)]
      if (recipeMatches.length > 0) {
        newSuggestions = recipeMatches.map(
          match => `Show ingredients for ${cleanRecipeName(match[1])}`
        )
      }
    }

    setQuickReplies(newSuggestions.slice(0, 3))
  }, [messages, isGenerating])

  // Enhanced stop function that marks pending tool calls as cancelled
  const handleStop = useCallback(() => {
    stop?.()

    if (!setMessages) return

    const latestMessages = [...messagesRef.current]
    const lastAssistantMessage = latestMessages.findLast(
      (m) => m.role === "assistant"
    )

    if (!lastAssistantMessage) return

    let needsUpdate = false
    let updatedMessage = { ...lastAssistantMessage }

    if (lastAssistantMessage.toolInvocations) {
      const updatedToolInvocations = lastAssistantMessage.toolInvocations.map(
        (toolInvocation) => {
          if (toolInvocation.state === "call") {
            needsUpdate = true
            return {
              ...toolInvocation,
              state: "result",
              result: {
                content: "Tool execution was cancelled",
                __cancelled: true, // Special marker to indicate cancellation
              },
            } as const
          }
          return toolInvocation
        }
      )

      if (needsUpdate) {
        updatedMessage = {
          ...updatedMessage,
          toolInvocations: updatedToolInvocations,
        }
      }
    }

    if (lastAssistantMessage.parts && lastAssistantMessage.parts.length > 0) {
      const updatedParts = lastAssistantMessage.parts.map(
        (part: MessagePart) => {
          if (
            part.type === "tool-invocation" &&
            part.toolInvocation &&
            part.toolInvocation.state === "call"
          ) {
            needsUpdate = true
            return {
              ...part,
              toolInvocation: {
                ...part.toolInvocation,
                state: "result",
                result: {
                  content: "Tool execution was cancelled",
                  __cancelled: true,
                },
              },
            } as const
          }
          return part
        }
      )

      if (needsUpdate) {
        updatedMessage = {
          ...updatedMessage,
          parts: updatedParts,
        }
      }
    }

    if (needsUpdate) {
      const messageIndex = latestMessages.findIndex(
        (m) => m.id === lastAssistantMessage.id
      )
      if (messageIndex !== -1) {
        latestMessages[messageIndex] = updatedMessage
        setMessages(latestMessages)
      }
    }
  }, [stop, setMessages, messagesRef])

  const messageOptions = useCallback(
    (message: Message) => ({
      actions: onRateResponse ? (
        <>
          <div className="border-r pr-1">
            <CopyButton
              content={message.content}
              copyMessage="Copied response to clipboard!"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRateResponse(message.id, "thumbs-up")}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRateResponse(message.id, "thumbs-down")}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <CopyButton
          content={message.content}
          copyMessage="Copied response to clipboard!"
        />
      ),
    }),
    [onRateResponse]
  )

  return (
    <ChatContainer className={className}>
      {isEmpty && append && suggestions ? (
        <PromptSuggestions
          label="Let's chat 🍛"
          append={append}
          suggestions={suggestions}
        />
      ) : null}

      {messages.length > 0 ? (
        <ChatMessages messages={messages} quickReplies={quickReplies}>
          <MessageList
            messages={messages}
            isTyping={isTyping}
            messageOptions={messageOptions}
          />
          {quickReplies.length > 0 && append && (
            <div className="p-4">
              <PromptSuggestions append={append} suggestions={quickReplies} />
            </div>
          )}
        </ChatMessages>
      ) : null}

      <ChatForm
        className="mt-auto"
        isPending={isGenerating || isTyping}
        handleSubmit={handleSubmit}
      >
        {({ files, setFiles }) => (
          <MessageInput
            value={input}
            onChange={handleInputChange}
            files={files}
            setFiles={setFiles}
            stop={handleStop}
            isGenerating={isGenerating}
          />
        )}
      </ChatForm>
    </ChatContainer>
  )
}
Chat.displayName = "Chat"

export function ChatMessages({
  messages,
  children,
  quickReplies,
}: React.PropsWithChildren<{
  messages: Message[]
  quickReplies: string[]
}>) {
  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages, quickReplies])

  return (
    <div
      className="grid grid-cols-1 overflow-y-auto pb-4"
      ref={containerRef}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
    >
      <div className="max-w-full [grid-column:1/1] [grid-row:1/1]">
        {children}
      </div>

      {!shouldAutoScroll && (
        <div className="pointer-events-none flex flex-1 items-end justify-end [grid-column:1/1] [grid-row:1/1]">
          <div className="sticky bottom-0 left-0 flex w-full justify-end">
            <Button
              onClick={scrollToBottom}
              className="pointer-events-auto h-8 w-8 rounded-full ease-in-out animate-in fade-in-0 slide-in-from-bottom-1"
              size="icon"
              variant="ghost"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export const ChatContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("grid max-h-full w-full grid-rows-[1fr_auto]", className)}
      {...props}
    />
  )
})
ChatContainer.displayName = "ChatContainer"

interface ChatFormProps {
  className?: string
  isPending: boolean
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  children: (props: {
    files: File[] | null
    setFiles: React.Dispatch<React.SetStateAction<File[] | null>>
  }) => ReactElement
}

export const ChatForm = forwardRef<HTMLFormElement, ChatFormProps>(
  ({ children, handleSubmit, className }, ref) => {
    const [files, setFiles] = useState<File[] | null>(null)

    const onSubmit = (event: React.FormEvent) => {
      if (!files) {
        handleSubmit(event)
        return
      }

      const fileList = createFileList(files)
      handleSubmit(event, { experimental_attachments: fileList })
      setFiles(null)
    }

    return (
      <form ref={ref} onSubmit={onSubmit} className={className}>
        {children({ files, setFiles })}
      </form>
    )
  }
)
ChatForm.displayName = "ChatForm"

function createFileList(files: File[] | FileList): FileList {
  const dataTransfer = new DataTransfer()
  for (const file of Array.from(files)) {
    dataTransfer.items.add(file)
  }
  return dataTransfer.files
}
