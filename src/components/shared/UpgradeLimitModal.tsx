"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface UpgradeLimitModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function UpgradeLimitModal({ open, onClose, title = "You’ve reached your free trial limit", message }: UpgradeLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="mt-2 text-sm text-slate-400">
          {message}
        </DialogDescription>
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-slate-950/90 border border-white/10 p-4 text-sm text-slate-300">
            Upgrade to BrainBuddy Premium for $20/month to keep learning with your personal AI tutor.
          </div>
        </div>
        <DialogFooter className="mt-6 gap-2">
          <Link href="/premium/checkout" className="inline-flex w-full justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-purple-500/20">
            Upgrade Now
          </Link>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
