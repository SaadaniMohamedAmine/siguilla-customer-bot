"use client";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-serif text-h1 text-text">Something went wrong on our side.</h1>
      <Button variant="ghost" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
