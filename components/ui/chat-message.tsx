"use client"

import React, { useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Ban, ChevronRight, Terminal } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { ToolInvocation } from "@/components/ui/tool-invocation"

const chatBubbleVariants = cva(
  "group/message relative break-words rounded-lg p-3 text-sm sm:max-w-[70%]",
  {
    variants: {
      isUser: {
        true: "bg-primary text-primary-foreground",
        false: "bg-muted text-foreground",
      },
      animation: {
        none: "",
        slide: "duration-300 animate-in fade-in-0",
        scale: "duration-300 animate-in fade-in-0 zoom-in-75",
        fade: "duration-500 animate-in fade-in-0",
      },
    },
    compoundVariants: [
      {
        isUser: true,
        animation: "slide",
        class: "slide-in-from-right",
      },
      {
        isUser: false,
        animation: "slide",
        class: "slide-in-from-left",
      },
      {
        isUser: true,
        animation: "scale",
        class: "origin-bottom-right",
      },
      {
        isUser: false,
        animation: "scale",
        class: "origin-bottom-left",
      },
    ],
  }
)

type Animation = VariantProps<typeof chatBubbleVariants>["animation"]

interface Attachment {
  name?: string
  contentType?: string
  url: string
}

interface PartialToolCall {
  state: "partial-call"
  toolName: string
  args: unknown
  result?: unknown
}

interface ToolCall {
  state: "call"
  toolName: string
  args: unknown
  result?: unknown
}

interface ToolResult {
  state: "result"
  toolName: string
  args: unknown
  result: {
    __cancelled?: boolean
    [key: string]: unknown
  }
}

type ToolInvocationType = PartialToolCall | ToolCall | ToolResult

interface ReasoningPart {
  type: "reasoning"
  reasoning: string
}

interface ToolInvocationPart {
  type: "tool-invocation"
  toolInvocation: ToolInvocationType
}

interface TextPart {
  type: "text"
  text: string
}

// For compatibility with AI SDK types, not used
interface SourcePart {
  type: "source"
  source?: unknown
}

interface FilePart {
  type: "file"
  mimeType: string
  data: string
}

interface StepStartPart {
  type: "step-start"
}

export type MessagePart =
  | TextPart
  | ReasoningPart
  | ToolInvocationPart
  | SourcePart
  | FilePart
  | StepStartPart

export interface Message {
  id: string
  role: "user" | "assistant" | (string & {})
  content: string
  createdAt?: Date
  experimental_attachments?: Attachment[]
  toolInvocations?: ToolInvocationType[]
  parts?: MessagePart[]
}

export interface ChatMessageProps extends Message {
  showTimeStamp?: boolean
  animation?: Animation
  actions?: React.ReactNode
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  createdAt,
  showTimeStamp = false,
  animation = "scale",
  actions,
  toolInvocations,
  parts,
}) => {
  const isUser = role === "user"

  const formattedTime = createdAt?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (isUser) {
    return (
      <div
        className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
      >
        <div className={cn(chatBubbleVariants({ isUser, animation }))}>
          <MarkdownRenderer>{content}</MarkdownRenderer>
        </div>

        {showTimeStamp && createdAt ? (
          <time
            dateTime={createdAt.toISOString()}
            className={cn(
              "mt-1 block px-1 text-xs opacity-50",
              animation !== "none" && "duration-500 animate-in fade-in-0"
            )}
          >
            {formattedTime}
          </time>
        ) : null}
      </div>
    )
  }

  if (parts && parts.length > 0) {
    return (
      <>
        {parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <div
                className={cn(
                  "flex flex-col",
                  isUser ? "items-end" : "items-start"
                )}
                key={`text-${index}`}
              >
                <div className={cn(chatBubbleVariants({ isUser, animation }))}>
                  <MarkdownRenderer>{part.text}</MarkdownRenderer>
                  {actions ? (
                    <div className="absolute -bottom-4 right-2 flex space-x-1 rounded-lg border bg-background p-1 text-foreground opacity-0 transition-opacity group-hover/message:opacity-100">
                      {actions}
                    </div>
                  ) : null}
                </div>

                {showTimeStamp && createdAt ? (
                  <time
                    dateTime={createdAt.toISOString()}
                    className={cn(
                      "mt-1 block px-1 text-xs opacity-50",
                      animation !== "none" && "duration-500 animate-in fade-in-0"
                    )}
                  >
                    {formattedTime}
                  </time>
                ) : null}
              </div>
            )
          } else if (part.type === "reasoning") {
            return <ReasoningBlock key={`reasoning-${index}`} part={part} />
          } else if (part.type === "tool-invocation") {
            return (
              <ToolInvocations
                key={`tool-${index}`}
                toolInvocations={[part.toolInvocation]}
              />
            )
          }
          return null
        })}
      </>
    )
  }

  return (
    <div
      className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
    >
      <div className={cn(chatBubbleVariants({ isUser, animation }))}>
        <MarkdownRenderer>{content}</MarkdownRenderer>
        {actions ? (
          <div className="absolute -bottom-4 right-2 flex space-x-1 rounded-lg border bg-background p-1 text-foreground opacity-0 transition-opacity group-hover/message:opacity-100">
            {actions}
          </div>
        ) : null}
      </div>
      <ToolInvocations toolInvocations={toolInvocations} />

      {showTimeStamp && createdAt ? (
        <time
          dateTime={createdAt.toISOString()}
          className={cn(
            "mt-1 block px-1 text-xs opacity-50",
            animation !== "none" && "duration-500 animate-in fade-in-0"
          )}
        >
          {formattedTime}
        </time>
      ) : null}
    </div>
  )
}

const ReasoningBlock = ({ part }: { part: ReasoningPart }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible
      className="my-2 rounded-lg border bg-muted/50 p-2"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <CollapsibleTrigger asChild>
        <div className="flex cursor-pointer items-center gap-2 text-sm">
          <Terminal className="h-4 w-4" />
          <span>Reasoning</span>
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen ? "rotate-90" : "rotate-0"
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="prose-p:leading-relaxed prose-pre:p-2 prose-sm mt-2 max-w-full overflow-x-auto rounded-lg bg-black p-2 text-white">
          <pre>{part.reasoning}</pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ToolInvocations({
  toolInvocations,
}: Pick<ChatMessageProps, "toolInvocations">) {
  if (!toolInvocations || toolInvocations.length === 0) return null

  return (
    <div className="my-2 flex w-full flex-col items-start gap-2">
      {toolInvocations.map((tool, index) => {
        if (tool.state === "call") {
          return (
            <ToolInvocation
              key={index}
              toolName={tool.toolName}
              args={tool.args}
              status={"running"}
            />
          )
        } else if (tool.state === "result") {
          const isCancelled = tool.result?.__cancelled === true
          if (isCancelled) {
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
              >
                <Ban className="h-4 w-4" />
                <span>
                  Cancelled{" "}
                  <span className="font-mono">
                    {"`"}
                    {tool.toolName}
                    {"`"}
                  </span>
                </span>
              </div>
            )
          }

          return (
            <ToolInvocation
              key={index}
              toolName={tool.toolName}
              args={tool.result}
              status={"complete"}
            />
          )
        }
        return null
      })}
    </div>
  )
}

