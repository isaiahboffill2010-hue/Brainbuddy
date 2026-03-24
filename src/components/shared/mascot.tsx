import { cn } from "@/lib/utils/cn";

interface MascotProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
  mood?: "happy" | "thinking" | "excited";
}

const moodEmoji = {
  happy: "🤖",
  thinking: "🤔",
  excited: "🌟",
};

export function Mascot({ size = "md", animated = true, className, mood = "happy" }: MascotProps) {
  const sizeClasses = {
    sm: "text-3xl",
    md: "text-5xl",
    lg: "text-7xl",
    xl: "text-9xl",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30",
        {
          "p-2": size === "sm",
          "p-3": size === "md",
          "p-4": size === "lg",
          "p-6": size === "xl",
        },
        animated && "animate-bounce-slow",
        className
      )}
    >
      <span className={cn(sizeClasses[size], "select-none")}>{moodEmoji[mood]}</span>
    </div>
  );
}
