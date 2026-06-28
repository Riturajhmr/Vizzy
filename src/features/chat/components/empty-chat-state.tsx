interface EmptyChatStateProps {
  onSelectPrompt: (prompt: string) => void
}

const EXAMPLE_PROMPTS = [
  { emoji: '🎨', label: 'Design a poster', prompt: 'Design a vintage-style poster for a jazz festival this summer in New York' },
  { emoji: '🖼️', label: 'Generate an image', prompt: 'Generate a photorealistic image of a lone lighthouse at sunset on a rocky coast' },
  { emoji: '✍️', label: 'Write a story', prompt: 'Write a short story about an astronaut who discovers a lost civilization on Mars' },
  { emoji: '💡', label: 'Create a logo', prompt: 'Create a modern minimalist logo for a coffee brand called "Ember Roast"' },
]

export function EmptyChatState({ onSelectPrompt }: EmptyChatStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
      {/* Brand mark */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg"
          aria-hidden="true"
        >
          <span className="text-2xl font-bold text-primary-foreground">V</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            What do you want to create?
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
            Describe your idea in plain language. Vizzy understands your intent and routes to the right creative workflow automatically.
          </p>
        </div>
      </div>

      {/* Example prompts */}
      <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-ring hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-lg" aria-hidden="true">{item.emoji}</span>
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
