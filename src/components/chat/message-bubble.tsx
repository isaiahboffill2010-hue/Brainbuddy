import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "@/types/app";
import Image from "next/image";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-sm font-medium",
        isUser
          ? "bg-primary/20 border border-primary/30 text-primary"
          : "bg-gradient-to-br from-violet-500/30 to-blue-500/20 border border-primary/20 shadow-glow-sm"
      )}>
        {isUser ? "😊" : "🧠"}
      </div>

      <div className={cn("flex flex-col gap-1.5 max-w-[80%]", isUser && "items-end")}>
        {/* Image attachment */}
        {message.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-white/10 max-w-[200px]">
            <Image src={message.imageUrl} alt="Homework" width={200} height={150} className="object-cover" />
          </div>
        )}

        {/* Text bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-gradient-brand text-white rounded-tr-sm shadow-glow-sm"
            : "glass-bright border border-white/8 text-foreground rounded-tl-sm",
          message.isStreaming && "streaming-cursor"
        )}>
          <MessageContent content={message.content} isStreaming={message.isStreaming} />
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const numbered = line.match(/^(\d+)\.\s+(.+)/);
        if (numbered) {
          return (
            <div key={i} className="flex gap-2">
              <span className="flex-shrink-0 font-bold text-primary/80">{numbered[1]}.</span>
              <span>{renderInline(numbered[2])}</span>
            </div>
          );
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="flex-shrink-0 text-primary/60">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
      {isStreaming && <span className="inline-block w-0.5 h-4 bg-primary/80 animate-pulse ml-0.5" />}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
