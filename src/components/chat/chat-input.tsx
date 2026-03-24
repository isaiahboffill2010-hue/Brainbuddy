"use client";
import { useState, useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface ChatInputProps {
  onSend: (message: string, imageUrl?: string) => void;
  disabled?: boolean;
  studentId: string;
  subjectId?: string;
}

export function ChatInput({ onSend, disabled, studentId, subjectId }: ChatInputProps) {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("studentId", studentId);
    if (subjectId) form.append("subjectId", subjectId);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (res.ok) {
      const data = await res.json();
      setImageUrl(data.image_url);
    }
    setUploading(false);
  }

  function handleSend() {
    if (!text.trim() && !imageUrl) return;
    onSend(text.trim() || "Please help me with this homework.", imageUrl ?? undefined);
    setText("");
    setImageUrl(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-white/5 bg-background/80 backdrop-blur p-3 space-y-2">
      {imageUrl && (
        <div className="relative inline-block">
          <Image src={imageUrl} alt="Attached" width={80} height={60} className="rounded-xl object-cover border border-white/10" />
          <button
            onClick={() => setImageUrl(null)}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-10 w-10 rounded-xl border border-white/8 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-primary transition-all"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || uploading}
          title="Upload homework photo"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </Button>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask BrainBuddy anything... (Enter to send)"
          className="min-h-[40px] max-h-[120px] resize-none text-sm bg-secondary/50 border-white/8 focus:border-primary/40 rounded-xl"
          disabled={disabled}
          rows={1}
        />

        <Button
          type="button"
          size="icon"
          className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-brand border-0 shadow-glow-sm hover:shadow-glow-md transition-all hover:opacity-90 disabled:opacity-30"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !imageUrl)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
