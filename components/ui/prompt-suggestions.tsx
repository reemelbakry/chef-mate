interface PromptSuggestionsProps {
  label?: string
  append: (message: { role: "user"; content: string }) => void
  suggestions: string[]
}

export function PromptSuggestions({
  label,
  append,
  suggestions,
}: PromptSuggestionsProps) {
  return (
    <div className="space-y-4">
      {label && <h2 className="text-center text-2xl font-bold">{label}</h2>}
      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-4">
        {suggestions.map(suggestion => (
          <button
            key={suggestion}
            onClick={() => append({ role: "user", content: suggestion })}
            className="h-max flex-1 rounded-xl border bg-background p-4 hover:bg-muted"
          >
            <p>{suggestion}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
