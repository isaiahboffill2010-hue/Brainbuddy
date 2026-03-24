export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 border border-primary/20 shadow-glow-sm flex items-center justify-center text-sm">
        🧠
      </div>
      <div className="glass-bright border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
