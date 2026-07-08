"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Copy-link share control for a market page (native share sheet on mobile). */
export function ShareButton({ question }: { question: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: question, url });
        return;
      }
    } catch {
      /* user dismissed the sheet — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — nothing sensible to do */
    }
  }

  return (
    <Button onClick={share} variant="outline" size="sm" className="gap-1.5">
      {copied ? <Check className="h-4 w-4 text-yes-fg" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
