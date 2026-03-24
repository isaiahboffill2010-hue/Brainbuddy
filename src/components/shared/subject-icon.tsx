import { cn } from "@/lib/utils/cn";

interface SubjectIconProps {
  icon: string;
  color: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SubjectIcon({ icon, color, name, size = "md", className }: SubjectIconProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-lg",
    md: "h-12 w-12 text-2xl",
    lg: "h-16 w-16 text-3xl",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: `${color}20`, border: `2px solid ${color}40` }}
      title={name}
    >
      <span className="select-none">{icon}</span>
    </div>
  );
}
