"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Camera, X, Loader2, CheckCircle, ImagePlus } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!file) return;
    setUploading(true);
    try {
      const studentsRes = await fetch("/api/students");
      const students = await studentsRes.json();
      const studentId = students[0]?.id;
      if (!studentId) throw new Error("No student profile found");

      const subjectsRes = await fetch("/api/subjects");
      const subjects = subjectsRes.ok ? await subjectsRes.json() : [];

      const form = new FormData();
      form.append("file", file);
      form.append("studentId", studentId);
      if (question) form.append("questionText", question);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const upload = await uploadRes.json();

      const mathSubject = subjects.find((s: { name: string }) => s.name === "Math") ?? subjects[0];
      const sessionRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, subjectId: mathSubject?.id, title: "Homework Help" }),
      });
      if (!sessionRes.ok) throw new Error("Could not start session");
      const session = await sessionRes.json();

      await fetch(`/api/chat/${session.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question || "Please help me understand this homework problem.",
          imageUrl: upload.image_url,
        }),
      });

      setSuccess(true);
      setSessionId(session.id);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (success && sessionId) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
        <div className="h-20 w-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.2)]">
          <CheckCircle className="h-10 w-10 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">BrainBuddy is ready! 🎉</h2>
          <p className="text-muted-foreground text-sm mt-1">Your homework is uploaded. Let&apos;s figure it out together!</p>
        </div>
        <Button
          size="lg"
          onClick={() => router.push(`/chat/${sessionId}`)}
          className="bg-gradient-brand border-0 shadow-glow-md hover:opacity-90 gap-2 px-8"
        >
          Start Learning 🚀
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Homework 📸</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Snap a photo or upload an image — BrainBuddy will help you understand it step by step!
        </p>
      </div>

      {/* Drop zone or preview */}
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-3xl p-12 text-center cursor-pointer hover:bg-primary/5 transition-all space-y-4 bg-gradient-to-br from-primary/5 to-accent/5"
        >
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-glow-sm">
              <ImagePlus className="h-8 w-8 text-primary/80" />
            </div>
          </div>
          <div>
            <p className="font-semibold">Drop your homework here</p>
            <p className="text-sm text-muted-foreground mt-1">or click to take a photo / browse files</p>
          </div>
          <Button variant="outline" type="button" className="border-primary/25 hover:bg-primary/10 hover:border-primary/50">
            <Camera className="h-4 w-4 mr-2" />
            Choose Image
          </Button>
        </div>
      ) : (
        <div className="glass-bright rounded-2xl border border-white/8 p-4">
          <div className="relative">
            <Image
              src={preview}
              alt="Homework preview"
              width={400}
              height={300}
              className="w-full rounded-xl object-contain max-h-[300px]"
            />
            <button
              onClick={() => { setPreview(null); setFile(null); }}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 border border-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">What do you need help with? (optional)</Label>
        <Textarea
          placeholder="e.g. I don't understand question 3..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          className="bg-secondary/50 border-white/8 focus:border-primary/40 rounded-xl resize-none"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!file || uploading}
        size="lg"
        className="w-full bg-gradient-brand border-0 shadow-glow-sm hover:shadow-glow-md transition-all hover:opacity-90 gap-2 h-12"
      >
        {uploading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
        ) : (
          <><Upload className="h-4 w-4" /> Get Help from BrainBuddy</>
        )}
      </Button>
    </div>
  );
}
