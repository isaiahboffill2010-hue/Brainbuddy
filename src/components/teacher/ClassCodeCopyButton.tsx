"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ClassCodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard?.writeText(code).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/20 transition-colors"
      title="Copy class code"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {code}
    </button>
  );
}
