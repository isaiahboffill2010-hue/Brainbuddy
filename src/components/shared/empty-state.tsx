interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  emoji?: string;
}

export function EmptyState({ title, description, action, emoji = "🧠" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 flex items-center justify-center text-4xl shadow-glow-sm">
        {emoji}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
