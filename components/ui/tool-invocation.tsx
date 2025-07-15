"use client"

import React from "react"
import { motion } from "framer-motion"
import { Check, Code2, Loader2, AlertTriangle } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface ToolInvocationProps {
  toolName: string
  args: any
  status: "running" | "complete" | "error"
}

export function ToolInvocation({
  toolName,
  args,
  status,
}: ToolInvocationProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "complete":
        return <Check className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "running":
        return `Calling tool: ${toolName}`
      case "complete":
        return `Called tool: ${toolName}`
      case "error":
        return `Error in tool: ${toolName}`
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="my-2"
    >
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/50 p-2 text-sm">
            {getStatusIcon()}
            <span>{getStatusMessage()}</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 w-fit overflow-x-auto rounded-lg bg-black p-2">
            <pre className="text-xs text-white">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  )
} 