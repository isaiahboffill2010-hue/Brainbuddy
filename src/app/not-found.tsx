import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center p-8 bg-background">
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] glow-blob-purple pointer-events-none" />
      <div className="relative z-10 space-y-6">
        <div className="h-24 w-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center text-5xl shadow-glow-md animate-float">
          🤔
        </div>
        <div>
          <h1 className="text-3xl font-bold">Page not found</h1>
          <p className="text-muted-foreground mt-2">Even BrainBuddy couldn&apos;t find this one!</p>
        </div>
        <Link href="/">
          <Button size="lg" className="bg-gradient-brand border-0 shadow-glow-sm hover:shadow-glow-md hover:opacity-90 transition-all">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
